package store

import (
	"crud/internal/model"
	"database/sql"
	"fmt"
	"strings"

	_ "github.com/lib/pq"
)

var _ Store = &PostgresStore{}

type PostgresStore struct {
	config *Config
	db     *sql.DB

	todos TodoRepository
}

func NewPostgresStore(config *Config) Store { // ?
	store := &PostgresStore{
		config: config,
	}

	todoRepo := newPostgresTodoRepository(store)

	store.todos = todoRepo

	return store
}

func (s *PostgresStore) Todos() TodoRepository {
	return s.Todos()
}

func (s *PostgresStore) Open() error {
	db, err := sql.Open("postgres", s.config.DatabaseUrl)
	if err != nil {
		return err
	}

	if err := db.Ping(); err != nil {
		return err
	}

	s.db = db

	return nil
}

func (s *PostgresStore) Close() error {
	return s.db.Close()
}

var _ TodoRepository = &PostgresTodoRepository{}

type PostgresTodoRepository struct {
	store *PostgresStore
}

func newPostgresTodoRepository(store *PostgresStore) TodoRepository {
	return &PostgresTodoRepository{
		store: store,
	}
}

func (r *PostgresTodoRepository) GetTodos(ids []model.ID) ([]model.Todo, error) {
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

func (r *PostgresTodoRepository) CreateTodo(title string) (model.Todo, error) {
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

func (r *PostgresTodoRepository) ToggleTodo(id model.ID) (model.Todo, error) {
	var todo model.Todo = model.Todo{}

	if err := r.store.db.QueryRow(
		`UPDATE todos SET complete = NOT complete WHERE id=$1 RETURNING id, title, complete, created_at`,
		id,
	).Scan(&todo.ID, &todo.Title, &todo.Complete, &todo.CreatedAt); err != nil {
		return model.Todo{}, err
	}

	return todo, nil
}

func (r *PostgresTodoRepository) UpdateTodo(id model.ID, title *string, complete *bool) (model.Todo, error) {
	var todo model.Todo = model.Todo{}

	if err := r.store.db.QueryRow(
		`UPDATE todos 
			SET title=COALESCE($2, title), 
				complete=COALESCE($3, complete) 
			WHERE id=$1 RETURNING id, title, complete, created_at`,
		id,
		title,
		complete,
	).Scan(&todo.ID, &todo.Title, &todo.Complete, &todo.CreatedAt); err != nil {
		return model.Todo{}, err
	}

	return todo, nil
}

func (r *PostgresTodoRepository) DeleteTodo(id model.ID) (model.Todo, error) {
	var todo model.Todo = model.Todo{}

	if err := r.store.db.QueryRow(
		`DELETE FROM todos WHERE id=$1 RETURNING id, title, complete, created_at`,
		id,
	).Scan(&todo.ID, &todo.Title, &todo.Complete, &todo.CreatedAt); err != nil {
		return model.Todo{}, err
	}

	return todo, nil
}
