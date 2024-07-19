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

//TODO: завернуть в Docker
//TODO: README.md
//TODO: попарвить README репозитория

func main() {
	flag.Parse()

	appConfig := NewAppConfig()
	_, err := toml.DecodeFile(configPath, appConfig)
	if err != nil {
		slog.Error(err.Error())
		return
	}

	overrideEnv(appConfig)

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

	store := store.New(appConfig.Store)

	if err := store.Open(); err != nil {
		logger.Error("Error opening database connection", err.Error())
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

func overrideEnv(config *AppConfig) {
	if dbUrl := os.Getenv("DATABASE_URL"); dbUrl != "" {
		config.Store.DatabaseUrl = dbUrl
	}
	if logLevel := os.Getenv("LOG_LEVEL"); logLevel != "" {
		config.LogLevel = logLevel
	}
}
