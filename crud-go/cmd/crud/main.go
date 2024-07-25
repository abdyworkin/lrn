package main

import (
	"crud/internal/config"
	"crud/internal/store"
	"crud/internal/transport"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	appConfig, err := config.ParseConfig()
	if err != nil {
		slog.Error("Failed init app configuration", "error", err.Error())
		return
	}

	logLevel := new(slog.LevelVar)

	switch appConfig.LogLevel {
	case "debug":
		logLevel.Set(slog.LevelDebug)
	case "info":
		logLevel.Set(slog.LevelInfo)
	case "warn":
		logLevel.Set(slog.LevelWarn)
	case "error":
		logLevel.Set(slog.LevelError)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))

	logger.Info("Logger configured")

	store := store.NewPostgresStore(appConfig.Store)

	if err := store.Open(); err != nil {
		logger.Error("Error opening database connection", "error", err.Error())
		return
	}

	errChan := make(chan error)

	// Starting HTTP server
	go func() {
		httpServer := transport.NewHttpServer(logger, store, appConfig.Http, appConfig.Service)
		errChan <- httpServer.Start()
	}()

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		errChan <- fmt.Errorf("%s", <-c)
	}()

	logger.Warn("Server closed", "error", (<-errChan).Error())
}
