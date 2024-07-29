package rmq

import (
	"encoding/json"
	"fieldval/internal/service"
	"fieldval/internal/transport"
	"fmt"
	"log/slog"

	"github.com/streadway/amqp"
)

var InvalidRequestResponse = []byte(`{"type": "error", "message": "invalid request"}`)
var HandlerNotFoundResponse = []byte(`{"type": "error", "message": "handler not found"}`)

type RabbitRequest struct {
	Pattern struct {
		Action string `json:"action"`
	} `json:"pattern"`
	Data json.RawMessage `json:"data"`
}

//TODO: отрефакторить, слушать только одну очередь

var _ RabbitMQServer = &DefaultRabbitMQServer{}

type DefaultRabbitMQServer struct {
	config  *Config
	logger  *slog.Logger
	conn    *amqp.Connection
	channel *amqp.Channel

	handlers map[string]RabbitHandler

	service service.Service
}

func NewRabbitMQServer(service service.Service, logger *slog.Logger, config *Config) *DefaultRabbitMQServer {
	return &DefaultRabbitMQServer{
		logger:   logger,
		config:   config,
		service:  service,
		handlers: make(map[string]RabbitHandler),
	}
}

// Open implements RabbitMQServer.
func (d *DefaultRabbitMQServer) Open() error {
	conn, err := amqp.Dial(d.config.RabbitMQUrl)
	if err != nil {
		return fmt.Errorf("failed to connect to rabbitMQ: %s", err.Error())
	}

	channel, err := conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to open channel: %s", err.Error())
	}

	d.conn = conn
	d.channel = channel

	return nil
}

// Close implements RabbitMQServer.
func (d *DefaultRabbitMQServer) Close() error {
	err := d.channel.Close()
	if err != nil {
		return err
	}

	err = d.conn.Close()
	if err != nil {
		return err
	}

	return nil
}

func (d *DefaultRabbitMQServer) addHandler(name string, handler RabbitHandler) error {
	d.handlers[name] = handler
	return nil
}

// Handle implements RabbitMQServer.
func (d *DefaultRabbitMQServer) Start(queue string) error {
	d.setupHandlers()

	q, err := d.channel.QueueDeclare(
		queue,
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to declare a queue: %s", err.Error())
	}

	messages, err := d.channel.Consume(
		q.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to register consumer: %s", err.Error())
	}

	go func() {
		for message := range messages {
			var rabbitMessage RabbitRequest
			err := json.Unmarshal(message.Body, &rabbitMessage)
			if err != nil {
				d.logger.Debug("failed unmarshal rabbit request", "error", err.Error())
				err = d.channel.Publish(
					"",
					message.ReplyTo,
					false,
					false,
					amqp.Publishing{
						ContentType:   "application/json",
						CorrelationId: message.CorrelationId,
						Body:          InvalidRequestResponse,
					},
				)
				if err != nil {
					d.logger.Debug("failed to response an error", "error", err.Error())
				}
				continue
			}

			d.logger.Debug("New request", "action", rabbitMessage.Pattern.Action)

			handler, ok := d.handlers[rabbitMessage.Pattern.Action]
			if !ok {
				d.logger.Debug("failed to find handler", "handler", rabbitMessage.Pattern.Action)
				err = d.channel.Publish(
					"",
					message.ReplyTo,
					false,
					false,
					amqp.Publishing{
						ContentType:   "application/json",
						CorrelationId: message.CorrelationId,
						Body:          HandlerNotFoundResponse,
					},
				)
				if err != nil {
					d.logger.Debug("failed to response an error", "error", err.Error())
				}
				continue
			}

			processedData := handler(rabbitMessage.Data)

			err = d.channel.Publish(
				"",
				message.ReplyTo,
				false,
				false,
				amqp.Publishing{
					ContentType:   "application/json",
					CorrelationId: message.CorrelationId,
					Body:          processedData,
				},
			)
			if err != nil {
				d.logger.Error("failed to publish to queue", "queue", queue)
			} else {
				d.logger.Debug("Response published to queue", "queue", queue)
			}
		}
	}()

	return nil
}

func (d *DefaultRabbitMQServer) setupHandlers() error {
	d.addHandler("fields.create", pipe[transport.CreateRequest, transport.CreateResponse](
		transport.JsonDecoder,
		transport.NewCreateEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))

	d.addHandler("fields.update", pipe[transport.UpdateRequest, transport.UpdateResponse](
		transport.JsonDecoder,
		transport.NewUpdateEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))

	d.addHandler("fields.delete", pipe[transport.DeleteRequest, transport.DeleteResponse](
		transport.JsonDecoder,
		transport.NewDeleteEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	d.addHandler("fields.delete.taskid", pipe[transport.DeleteByTaskIdsRequest, transport.DeleteByTaskIdsResponse](
		transport.JsonDecoder,
		transport.NewDeleteByTaskIdsEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))

	d.addHandler("fields.delete.fieldid", pipe[transport.DeleteByFieldIdsRequest, transport.DeleteByFieldIdsResponse](
		transport.JsonDecoder,
		transport.NewDeleteByFieldIdsEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))

	d.addHandler("fields.get", pipe[transport.GetRequest, transport.GetResponse](
		transport.JsonDecoder,
		transport.NewGetEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))

	d.addHandler("fields.get.taskid", pipe[transport.GetByTaskIdsRequest, transport.GetByTaskIdsResponse](
		transport.JsonDecoder,
		transport.NewGetByTaskIdsEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))

	d.addHandler("fields.get.fieldid", pipe[transport.GetByFieldIdsRequest, transport.GetByFieldIdsResponse](
		transport.JsonDecoder,
		transport.NewGetByFieldIdsEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))

	return nil
}
