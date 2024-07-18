package store

import (
	"crud/internal/model"
	"fmt"
	"strings"
)

type ITodoRepository interface {
	GetTodos(ids []model.ID) ([]model.Todo, error)
	CreateTodo(title string) (model.Todo, error)
	ToggleTodo(id model.ID) (model.Todo, error)
	UpdateTodo(id model.ID, title string, complete bool) (model.Todo, error)
	DeleteTodo(id model.ID) (model.Todo, error)
}

var _ ITodoRepository = &TodoRepository{}

type TodoRepository struct {
	store *Store
}

func newTodoRepository(store *Store) ITodoRepository {
	return &TodoRepository{
		store: store,
	}
}

func (r *TodoRepository) GetTodos(ids []model.ID) ([]model.Todo, error) {
	ret := make([]model.Todo, 0, len(ids))

	idStrings := make([]string, len(ids))
	for i, id := range ids {
		idStrings[i] = fmt.Sprintf("%d", id)
	}

	idParam := strings.Join(idStrings, ", ")

	query := fmt.Sprintf(`SELECT id, title, complete, created_at FROM todos WHERE id IN (%s)`, idParam)

	if rows, err := r.store.db.Query(query); err == nil {
		for rows.Next() {
			var todo model.Todo

			if err := rows.Scan(&todo.ID, &todo.Title, &todo.Complete, &todo.CreatedAt); err != nil {
				return nil, err
			}

			ret = append(ret, todo)
		}

	} else {
		return nil, err
	}

	return ret, nil
}

func (r *TodoRepository) CreateTodo(title string) (model.Todo, error) {
	var todo model.Todo = model.Todo{
		Title:    title,
		Complete: false,
	}

	if err := r.store.db.QueryRow(
		`INSERT INTO todos (title, complete) VALUES ($1, $2) RETURNING id, created_at`,
		todo.Title,
		todo.Complete,
	).Scan(&todo.ID, &todo.CreatedAt); err != nil {
		return model.Todo{}, err
	}

	return todo, nil
}

func (r *TodoRepository) ToggleTodo(id model.ID) (model.Todo, error) {
	var todo model.Todo = model.Todo{}

	if err := r.store.db.QueryRow(
		`UPDATE todos SET complete = NOT complete WHERE id=$1 RETURNING id, title, complete, created_at`,
		id,
	).Scan(&todo.ID, &todo.Title, &todo.Complete, &todo.CreatedAt); err != nil {
		return model.Todo{}, err
	}

	return todo, nil
}

func (r *TodoRepository) UpdateTodo(id model.ID, title string, complete bool) (model.Todo, error) {
	var todo model.Todo = model.Todo{}

	if err := r.store.db.QueryRow(
		"UPDATE todos SET title=$2, complete=$3 WHERE id=$1 RETURNING id, title, complete, created_at",
		id,
		title,
		complete,
	).Scan(&todo.ID, &todo.Title, &todo.Complete, &todo.CreatedAt); err != nil {
		return model.Todo{}, err
	}

	return todo, nil
}

func (r *TodoRepository) DeleteTodo(id model.ID) (model.Todo, error) {
	var todo model.Todo = model.Todo{}

	if err := r.store.db.QueryRow(
		`DELETE FROM todos WHERE id=$1 RETURNING id, title, complete, created_at`,
		id,
	).Scan(&todo.ID, &todo.Title, &todo.Complete, &todo.CreatedAt); err != nil {
		return model.Todo{}, err
	}

	return todo, nil
}
