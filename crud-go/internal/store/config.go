package store

type Config struct {
	DatabaseUrl string
}

func NewConfig() *Config {
	return &Config{}
}
