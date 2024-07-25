package rmq

type RabbitHandler func([]byte) []byte

type RabbitMQServer interface {
	Open() error
	Close() error

	StartHandlers() error
}
