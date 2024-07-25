package store

import "fieldval/internal/model"

type Store interface {
	Open() error
	Close() error

	Fields() FieldRepository
}

type FieldRepository interface {
	CreateFieldValues(fields []model.FieldValue) error
	UpdateFieldValues(fields []model.FieldValue) ([]model.FieldValue, error)
	DeleteFieldValues(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	GetFieldValues(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	GetFieldValuesForTasks(taskId []model.ID) ([]model.FieldValue, error)
}
