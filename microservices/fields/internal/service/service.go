package service

import (
	"fieldval/internal/store"
	"log/slog"
)

type Service struct {
	config *Config
	logger *slog.Logger

	store *store.Store
}

func NewService(store *store.Store, logger *slog.Logger, config *Config) *Service {
	return &Service{
		logger: logger,
		config: config,
		store:  store,
	}
}

//TODO: дописать сервис
