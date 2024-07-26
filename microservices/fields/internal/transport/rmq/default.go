package rmq

import (
	"fieldval/internal/service"
	"fieldval/internal/transport"
	"fmt"
	"log/slog"

	"github.com/streadway/amqp"
)

var _ RabbitMQServer = &DefaultRabbitMQServer{}

type DefaultRabbitMQServer struct {
	config  *Config
	logger  *slog.Logger
	conn    *amqp.Connection
	channel *amqp.Channel

	service service.Service
}

func NewRabbitMQServer(service service.Service, logger *slog.Logger, config *Config) *DefaultRabbitMQServer {
	return &DefaultRabbitMQServer{
		logger:  logger,
		config:  config,
		service: service,
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

// Handle implements RabbitMQServer.
func (d *DefaultRabbitMQServer) startQueue(queue string, handler RabbitHandler) error {
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
			d.logger.Debug("New message", "message", len(message.Body))

			processedData := handler(message.Body)

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

func (d *DefaultRabbitMQServer) StartHandlers() error {
	err := d.startQueue("fields.create", pipe[transport.CreateRequest, transport.CreateResponse](
		transport.JsonDecoder,
		transport.NewCreateEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	if err != nil {
		return err
	}

	err = d.startQueue("fields.update", pipe[transport.UpdateRequest, transport.UpdateResponse](
		transport.JsonDecoder,
		transport.NewUpdateEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	if err != nil {
		return err
	}

	err = d.startQueue("fields.delete", pipe[transport.DeleteRequest, transport.DeleteResponse](
		transport.JsonDecoder,
		transport.NewDeleteEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	if err != nil {
		return err
	}

	err = d.startQueue("fields.delete.taskid", pipe[transport.DeleteByTaskIdsRequest, transport.DeleteByTaskIdsResponse](
		transport.JsonDecoder,
		transport.NewDeleteByTaskIdsEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	if err != nil {
		return err
	}

	err = d.startQueue("fields.delete.fieldid", pipe[transport.DeleteByFieldIdsRequest, transport.DeleteByFieldIdsResponse](
		transport.JsonDecoder,
		transport.NewDeleteByFieldIdsEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	if err != nil {
		return err
	}

	err = d.startQueue("fields.get", pipe[transport.GetRequest, transport.GetResponse](
		transport.JsonDecoder,
		transport.NewGetEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	if err != nil {
		return err
	}

	err = d.startQueue("fields.get.taskid", pipe[transport.GetByTaskIdsRequest, transport.GetByTaskIdsResponse](
		transport.JsonDecoder,
		transport.NewGetByTaskIdsEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	if err != nil {
		return err
	}

	err = d.startQueue("fields.get.fieldid", pipe[transport.GetByFieldIdsRequest, transport.GetByFieldIdsResponse](
		transport.JsonDecoder,
		transport.NewGetByFieldIdsEndpoint(d.service),
		transport.JsonEncoder,
		d.logger,
	))
	if err != nil {
		return err
	}

	return nil
}
