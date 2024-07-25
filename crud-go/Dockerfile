FROM golang:1.22.2 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

RUN apt-get update && apt-get install -y make

RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

COPY . .

RUN make build

RUN echo '#!/bin/sh\n make migration_up\n  exec ./main' > ./build/ep.sh && chmod +x ./build/ep.sh

# Step 2: build smaller image

FROM scratch

COPY --from=builder /app/build /

EXPOSE 3000

CMD [ "sh", "./ep.sh" ]