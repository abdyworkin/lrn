package config

import (
	"errors"
	"fieldval/internal/service"
	"fieldval/internal/store"
	"fieldval/internal/transport/rmq"
	"log/slog"
	"os"

	"github.com/spf13/viper"
)

type AppConfig struct {
	LogLevel string
	Store    *store.Config
	Service  *service.Config
	Rmq      *rmq.Config
}

func NewAppConfig() *AppConfig {
	return &AppConfig{
		LogLevel: "debug",
		Store:    store.NewConfig(),
		Service:  service.NewConfig(),
		Rmq:      rmq.NewConfig(),
	}
}

func createDefaultConfig() error {
	viper.SetDefault("Service", service.NewConfig())
	viper.SetDefault("Store", store.NewConfig())
	viper.SetDefault("Rmq", rmq.NewConfig())
	viper.SetDefault("LogLevel", "debug")

	viper.SetConfigType("yaml")

	return viper.SafeWriteConfigAs("./config/config.yaml")
}

func importConfig() error {
	err := os.MkdirAll("./config/", os.ModePerm)
	if err != nil {
		return errors.New("create-config-dir")
	}

	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.SetConfigName("config.yaml")

	viper.BindEnv("Rmq.RabbitMQUrl", "RABBIT_MQ_URL")
	viper.BindEnv("Store.DatabaseUrl", "DATABASE_URL")
	viper.BindEnv("LogLevel", "LOG_LEVEL")

	if err := viper.ReadInConfig(); err != nil {
		slog.Warn("Config file does not exist, creating default config...")
		if err := createDefaultConfig(); err != nil {
			slog.Error("Failed create default config file", "error", err.Error())
			return err
		}

		if err := viper.ReadInConfig(); err != nil {
			slog.Error("Failed read default config file", "error", err.Error())
			return err
		}
	}
	return nil
}

func ParseConfig() (*AppConfig, error) {
	if err := importConfig(); err != nil {
		return nil, err
	}

	var c AppConfig
	err := viper.Unmarshal(&c)
	if err != nil {
		slog.Error("Failed decode loaded config file", "error", err.Error())
		return nil, err
	}

	return &c, nil
}
