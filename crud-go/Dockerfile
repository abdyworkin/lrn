FROM golang:1.22.2

WORKDIR /app

COPY go.* .

RUN go mod download

COPY . .

RUN go build -o main .

EXPOSE 3000

CMD ["./main"]