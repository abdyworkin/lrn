package model

import "time"

type ID uint64

type Todo struct {
	ID        ID        `json:"id"`
	Title     string    `json:"title"`
	Complete  bool      `json:"complete"`
	CreatedAt time.Time `json:"createdAt"`
}
