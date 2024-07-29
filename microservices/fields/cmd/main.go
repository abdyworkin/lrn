package main

import (
	"fieldval/internal/config"
	"fieldval/internal/service"
	"fieldval/internal/store"
	"fieldval/internal/transport/rmq"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	appConfig, err := config.ParseConfig()

	if err != nil {
		slog.Error("Failed app config init, exitting", "error", err.Error())
		return
	}

	logger := configuredLogger(appConfig.LogLevel)

	errChan := make(chan error, 10)

	logger.Info("App initializing...")
	logger.Info("Loaded config file")

	store := store.NewPostgresStore(logger.With("module", "store"), appConfig.Store)

	if err := store.Open(); err != nil {
		errChan <- err
		slog.Error("failed start store", "error", err.Error())
	}

	service := service.NewService(store, logger.With("module", "service"), appConfig.Service)

	go func() {
		rmqServer := rmq.NewRabbitMQServer(service, logger.With("module", "rmq"), appConfig.Rmq)

		if err := rmqServer.Open(); err != nil {
			errChan <- err
			logger.Error("failed start rmq server", "error", err.Error())
		}

		if err := rmqServer.Start("fields"); err != nil {
			errChan <- err
			logger.Error("failed start RabbitMQ handlers", "error", err.Error())
		}
	}()

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		errChan <- fmt.Errorf("signal: %s", <-c)
	}()

	logger.Info("service exitting", "error", <-errChan)
}

func configuredLogger(logLevel string) *slog.Logger {
	level := new(slog.LevelVar)
	switch logLevel {
	case "debug":
		level.Set(slog.LevelDebug)
	case "info":
		level.Set(slog.LevelInfo)
	case "warn":
		level.Set(slog.LevelWarn)
	case "error":
		level.Set(slog.LevelError)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: level,
	}))

	return logger
}
