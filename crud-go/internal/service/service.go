package service

import (
	"crud/internal/model"
	"crud/internal/store"
	"log/slog"
)

//go:generate mockgen -source=service.go -destination=mocks/service.go

type ITodoService interface {
	GetTodos(ids []model.ID) ([]model.Todo, error)
	CreateTodo(title string) (*model.Todo, error)
	ToggleTodo(id model.ID) (*model.Todo, error)
	UpdateTodo(id model.ID, title *string, complete *bool) (*model.Todo, error)
	DeleteTodo(id model.ID) (*model.Todo, error)
}

var _ ITodoService = &TodoService{}

type TodoService struct {
	config    *Config
	logger    *slog.Logger
	todosRepo store.TodoRepository
}

func NewTodoService(logger *slog.Logger, todosRepo store.TodoRepository, config *Config) ITodoService {
	return &TodoService{
		config:    config,
		logger:    logger,
		todosRepo: todosRepo,
	}
}

// CreateTodo implements ITodoService.
func (t *TodoService) CreateTodo(title string) (*model.Todo, error) {
	todo, err := t.todosRepo.CreateTodo(title)
	return &todo, err
}

// DeleteTodo implements ITodoService.
func (t *TodoService) DeleteTodo(id model.ID) (*model.Todo, error) {
	todo, err := t.todosRepo.DeleteTodo(id)
	return &todo, err
}

// GetTodos implements ITodoService.
func (t *TodoService) GetTodos(ids []model.ID) ([]model.Todo, error) {
	todos, err := t.todosRepo.GetTodos(ids)
	return todos, err
}

// ToggleTodo implements ITodoService.
func (t *TodoService) ToggleTodo(id model.ID) (*model.Todo, error) {
	todo, err := t.todosRepo.ToggleTodo(id)
	return &todo, err
}

// UpdateTodo implements ITodoService.
func (t *TodoService) UpdateTodo(id model.ID, title *string, complete *bool) (*model.Todo, error) {
	todo, err := t.todosRepo.UpdateTodo(id, title, complete)
	return &todo, err
}
