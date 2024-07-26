package service

import (
	"fieldval/internal/model"
	"log/slog"
)

type Service interface {
	Create(fields []model.FieldValue) error
	Update(fields []model.FieldValue) error
	Delete(fieldIds []model.FieldValuePrimaryKeys) error
	DeleteByFieldIds(fieldIds []model.ID) error
	DeleteByTaskIds(taskIds []model.ID) error
	Get(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	GetByTaskIds(taskIds []model.ID) ([]model.FieldValue, error)
	GetByFieldIds(fieldIds []model.ID) ([]model.FieldValue, error)
	Logger() *slog.Logger
}
