package config

import (
	"crud/internal/service"
	"crud/internal/store"
	"crud/internal/transport"
	"errors"
	"log/slog"
	"os"

	"github.com/spf13/viper"
)

type AppConfig struct {
	Service  *service.Config
	Store    *store.Config
	Http     *transport.HttpConfig
	LogLevel string
}

func NewAppConfig() *AppConfig {
	return &AppConfig{
		Service:  service.NewConfig(),
		Store:    store.NewConfig(),
		Http:     transport.NewHttpConfig(),
		LogLevel: "debug",
	}
}

func createDefaultConfig() error {
	viper.SetDefault("Service", service.NewConfig())
	viper.SetDefault("Store", store.NewConfig())
	viper.SetDefault("Http", transport.NewHttpConfig())
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

	viper.BindEnv("Store.DatabaseUrl", "DATABASE_URL")
	viper.BindEnv("Http.BindAddress", "HTTP_BIND_ADDRESS")
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
