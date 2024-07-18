package main

import (
	"crud/internal/store"
	"crud/internal/transport"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/BurntSushi/toml"
)

var (
	configPath string
)

func init() {
	flag.StringVar(&configPath, "config-path", "configs/apiserver.toml", "path to config file")
}

func main() {
	flag.Parse()

	appConfig := NewAppConfig()
	_, err := toml.DecodeFile(configPath, appConfig)
	if err != nil {
		slog.Error(err.Error())
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

	store := store.New(appConfig.Store)

	if err := store.Open(); err != nil {
		logger.Error(err.Error())
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

	logger.Warn("Server closed:", (<-errChan).Error())
}
