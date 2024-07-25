package rmq

type Config struct {
	RabbitMQUrl string
}

func NewConfig() *Config {
	return &Config{
		RabbitMQUrl: "amqp://guest:guest@rabbitmq:5672/",
	}
}
