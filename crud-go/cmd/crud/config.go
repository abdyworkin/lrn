package main

import (
	"crud/internal/service"
	"crud/internal/store"
	"crud/internal/transport"
)

type AppConfig struct {
	Service  *service.Config       `toml:"service"`
	Store    *store.Config         `toml:"store"`
	Http     *transport.HttpConfig `toml:"http"`
	LogLevel string                `toml:"log_level"`
}

func NewAppConfig() *AppConfig {
	return &AppConfig{
		Service:  service.NewConfig(),
		Store:    store.NewConfig(),
		Http:     transport.NewHttpConfig(),
		LogLevel: "debug",
	}
}
