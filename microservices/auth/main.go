package main

import (
	"auth/endpoints"
	"auth/model"
	"auth/service"
	"auth/transport"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	_ "auth/docs"
)

var (
	maxRetries = 50
	retryDelay = time.Second * 5
)

func connectToDatabase(databaseUrl string) (*gorm.DB, error) {
	var err error

	for i := 0; i < maxRetries; i++ {
		db, err := gorm.Open(postgres.Open(databaseUrl), &gorm.Config{})
		if err == nil {
			log.Println("Successfully connected to dataabse")
			return db, nil
		}

		log.Printf("Failed to connect to database (attampt %d/%d): %v", i+1, maxRetries, err)
		time.Sleep(retryDelay)
	}

	return nil, err
}

// @title Auth service API
// @version 0.0.1
// @description Сервис отвечает за аутентификацию, авторизацию и хранение данных пользователей
// @host localhost:3010
// @BasePath /

func main() {
	databaseUrl := os.Getenv("DATABASE_URL")
	serverPort := os.Getenv("SERVER_PORT")
	jwtSecret := os.Getenv("JWT_SERCRET")

	db, err := connectToDatabase(databaseUrl)
	if err != nil {
		log.Fatalf("Could not connect to database: %v", err)
	}

	db.AutoMigrate(&model.User{})

	authService := service.NewService(db, jwtSecret)
	endpoints := endpoints.Endpoints{
		SignUpEndpoint:        endpoints.MakeSignUpEndpoint(authService),
		SignInEndpoint:        endpoints.MakeSignInEndpoint(authService),
		ValidateTokenEndpoint: endpoints.MakeValidateEndpoint(authService),
		GetUsersByIdEndpoint:  endpoints.MakeGetUsersByIdEndpoint(authService),
	}

	httpHandler := transport.NewHTTPHandler(endpoints)

	errChan := make(chan error)

	go func() {
		fmt.Printf("Starting HTTP server at port %s", serverPort)
		errChan <- http.ListenAndServe(":"+serverPort, httpHandler)
	}()

	go func() {
		c := make(chan os.Signal, 1)
		signal.Notify(c, syscall.SIGINT, syscall.SIGTERM)
		errChan <- fmt.Errorf("%s", <-c)
	}()

	go transport.SetupRabbitMQ(authService, endpoints)

	log.Println("exit", <-errChan)

}
