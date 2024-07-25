package main

import (
	"fieldval/internal/config"
	"log/slog"
	"os"
)

func main() {
	appConfig, err := config.ParseConfig()

	if err != nil {
		slog.Error("Failed app config init, exitting", "error", err.Error())
		return
	}

	logger := configuredLogger(appConfig.LogLevel)

	logger.Info("App initializing...")
	logger.Info("Loaded config file")

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
