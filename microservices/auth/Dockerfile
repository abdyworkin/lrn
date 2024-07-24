FROM golang:1.22.2

WORKDIR /app

COPY go.* ./

RUN go mod download

COPY . .

RUN go build -o auth-service .

EXPOSE 3010

CMD ["./auth-service"]
