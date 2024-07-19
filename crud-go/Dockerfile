FROM golang:1.22.2

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download


RUN apt-get update && apt-get install -y make

RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

COPY . .

RUN make build

EXPOSE 3000

RUN echo '#!/bin/sh\n make migration_up\n  exec ./main' > ./ep.sh && chmod +x ./ep.sh

CMD ["./ep.sh"]
