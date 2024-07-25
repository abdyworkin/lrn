.PHONY: build migration_down migration_up

DATABASE_URL ?= postgres://root:root@localhost:5433/crud?sslmode=disable

build:
	go build -o build/main -v ./cmd/crud

migration_down:
	migrate -path migrations -database "$(DATABASE_URL)" down

migration_up:
	migrate -path migrations -database "$(DATABASE_URL)" up
