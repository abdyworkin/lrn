package store

import (
	"database/sql"

	_ "github.com/lib/pq"
)

type Store struct {
	config *Config
	db     *sql.DB

	Todos ITodoRepository
}

func New(config *Config) *Store { // ?
	store := &Store{
		config: config,
	}

	todoRepo := newTodoRepository(store)

	store.Todos = todoRepo

	return store
}

func (s *Store) Open() error {
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

func (s *Store) Close() {
	s.db.Close()
}
