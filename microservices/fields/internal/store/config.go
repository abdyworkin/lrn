package store

type Config struct {
	DatabaseUrl string
}

func NewConfig() *Config {
	return &Config{
		DatabaseUrl: "postgres://root:root@localhost:5432/fields?sslmode=disable",
	}
}
