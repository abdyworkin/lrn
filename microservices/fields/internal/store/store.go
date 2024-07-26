package store

import "fieldval/internal/model"

type Store interface {
	Open() error
	Close() error

	Fields() FieldRepository
}

type FieldRepository interface {
	Create(fields []model.FieldValue) error
	Update(fields []model.FieldValue) ([]model.FieldValue, error)
	Delete(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	DeleteByFields(fieldIds []model.ID) ([]model.FieldValue, error)
	DeleteByTasks(taskIds []model.ID) ([]model.FieldValue, error)
	Get(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	GetByTaskIds(taskId []model.ID) ([]model.FieldValue, error)
	GetByFields(fieldIds []model.ID) ([]model.FieldValue, error)
}
