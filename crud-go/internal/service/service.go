package service

import (
	"crud/internal/model"
	"crud/internal/store"
	"log/slog"
)

type ITodoService interface {
	GetTodos(ids []model.ID) ([]model.Todo, error)
	CreateTodo(title string) (*model.Todo, error)
	ToggleTodo(id model.ID) (*model.Todo, error)
	UpdateTodo(id model.ID, title *string, complete *bool) (*model.Todo, error)
	DeleteTodo(id model.ID) (*model.Todo, error)
}

var _ ITodoService = &TodoService{}

type TodoService struct {
	config *Config
	logger *slog.Logger
	store  store.Store
}

func NewTodoService(logger *slog.Logger, store store.Store, config *Config) ITodoService {
	return &TodoService{
		config: config,
		logger: logger,
		store:  store,
	}
}

// CreateTodo implements ITodoService.
func (t *TodoService) CreateTodo(title string) (*model.Todo, error) {
	todo, err := t.store.Todos().CreateTodo(title)
	return &todo, err
}

// DeleteTodo implements ITodoService.
func (t *TodoService) DeleteTodo(id model.ID) (*model.Todo, error) {
	todo, err := t.store.Todos().DeleteTodo(id)
	return &todo, err
}

// GetTodos implements ITodoService.
func (t *TodoService) GetTodos(ids []model.ID) ([]model.Todo, error) {
	todos, err := t.store.Todos().GetTodos(ids)
	return todos, err
}

// ToggleTodo implements ITodoService.
func (t *TodoService) ToggleTodo(id model.ID) (*model.Todo, error) {
	todo, err := t.store.Todos().ToggleTodo(id)
	return &todo, err
}

// UpdateTodo implements ITodoService.
func (t *TodoService) UpdateTodo(id model.ID, title *string, complete *bool) (*model.Todo, error) {
	todo, err := t.store.Todos().UpdateTodo(id, title, complete)
	return &todo, err
}
