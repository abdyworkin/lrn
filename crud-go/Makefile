.PHONY: build, migration_down, migration_up

build: 
	go build -o crud.exe -v ./cmd/crud

migration_down:
	migrate -path migrations -database "postgres://root:root@localhost:5433/crud?sslmode=disable" down

migration_up:
	migrate -path migrations -database "postgres://root:root@localhost:5433/crud?sslmode=disable" up
