package store

import (
	"crud/internal/model"
)

type Store interface {
	Open() error
	Close() error

	Todos() TodoRepository
}

type TodoRepository interface {
	GetTodos(ids []model.ID) ([]model.Todo, error)
	CreateTodo(title string) (model.Todo, error)
	ToggleTodo(id model.ID) (model.Todo, error)
	UpdateTodo(id model.ID, title *string, complete *bool) (model.Todo, error)
	DeleteTodo(id model.ID) (model.Todo, error)
}
