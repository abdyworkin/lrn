package transport

import (
	eps "auth/endpoints"
	"auth/service"
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/streadway/amqp"
)

type ErrorResponse struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

func connectToRabbitMQ(url string) (*amqp.Connection, error) {
	const maxRetries = 30
	var err error

	for i := 0; i < maxRetries; i++ {
		conn, err := amqp.Dial(url)
		if err == nil {
			log.Println("Successfully connected to rabbitMq")
			return conn, nil
		}

		log.Printf("Failed to connect to rabbitmq (attampt %d/%d): %v", i+1, maxRetries, err)
		time.Sleep(time.Second * 15)
	}

	return nil, err
}

func SetupRabbitMQ(serv service.AuthService, endpoints eps.Endpoints) {
	rabbitMqUrl := os.Getenv("RABBITMQ_URL")

	conn, err := connectToRabbitMQ(rabbitMqUrl)
	if err != nil {
		log.Fatalf("Failed to connect to rabbit mq: %v (%s)", err, rabbitMqUrl)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("Failed to open channel: %v", err)
	}

	q, err := ch.QueueDeclare(
		"auth_queue",
		false,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("Failed to declare a queue: %v", err)
	}

	messages, err := ch.Consume(
		q.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		log.Fatalf("Consumer register error: %v", err)
	}

	for d := range messages {
		log.Println(d)
		go handleRabbitMqMessage(ch, d, endpoints)
	}
}

func handleRabbitMqMessage(ch *amqp.Channel, d amqp.Delivery, endpoints eps.Endpoints) {
	var req struct {
		Pattern struct {
			Action string `json:"action"`
		} `json:"pattern"`
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(d.Body, &req); err != nil {
		log.Printf("Failed to unmarshal request: %v", err)
		return
	}

	var (
		response interface{}
		err      error
	)

	ctx := context.Background()

	switch req.Pattern.Action {
	case "signup":
		var request eps.SignUpRequest
		if err := json.Unmarshal(req.Data, &request); err != nil {
			log.Printf("Error unmarshalling sign up data: %v", err)
			return
		}

		response, err = endpoints.SignUpEndpoint(ctx, request)
	case "signin":
		var request eps.SignInRequest
		if err := json.Unmarshal(req.Data, &request); err != nil {
			log.Printf("Error unmarshalling sign in data: %v", err)
			return
		}

		response, err = endpoints.SignInEndpoint(ctx, request)
	case "validate_token":
		var request eps.ValidateTokenRequest
		if err := json.Unmarshal(req.Data, &request); err != nil {
			log.Printf("Error unmarshalling sign up data: %v", err)
			return
		}

		log.Printf("validate request, %+v \n", request)

		response, err = endpoints.ValidateTokenEndpoint(ctx, request)
	case "getusers":
		var request eps.GetUsersByIdRequest
		if err := json.Unmarshal(req.Data, &request); err != nil {
			log.Printf("Error unmarshalling sign up data: %v", err)
			return
		}

		response, err = endpoints.GetUsersByIdEndpoint(ctx, request)
	}

	if err != nil {
		log.Printf("Error processing request: %v", err)

		errorMessage, err := json.Marshal(ErrorResponse{
			Type:    "error",
			Message: err.Error(),
		})

		if err != nil {
			log.Printf("Error while marshalling error message :c %v\n", err)
		}

		err = ch.Publish(
			"",
			d.ReplyTo,
			false,
			false,
			amqp.Publishing{
				ContentType:   "application/json",
				CorrelationId: d.CorrelationId,
				Body:          errorMessage,
			},
		)
		if err != nil {
			log.Printf("Error publishing response: %v\n", err)
		}

		log.Printf("Request processed with error: %s\n", errorMessage)

		return
	}

	responseBody, err := json.Marshal(response)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return
	}

	err = ch.Publish(
		"",
		d.ReplyTo,
		false,
		false,
		amqp.Publishing{
			ContentType:   "application/json",
			CorrelationId: d.CorrelationId,
			Body:          responseBody,
		},
	)
	if err != nil {
		log.Printf("Error publishing response: %v", err)
	}

	log.Printf("Request processed: %s", responseBody)

}
