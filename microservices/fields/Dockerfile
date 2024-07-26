FROM golang:1.22.2 as builder

RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

WORKDIR /app

COPY go.* ./
RUN go mod download

COPY . .

RUN go build -o build/fields ./cmd/main.go

EXPOSE 3000

CMD ["sh", "-c", "migrate -path migrations -database ${DATABASE_URL} up && ./build/fields"]

# FROM scratch

# COPY --from=builder /app/build/fields ./
# COPY --from=builder /go/bin/migrate /usr/local/bin/migrate
# COPY migrations /migrations
