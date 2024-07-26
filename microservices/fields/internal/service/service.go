package service

import (
	"fieldval/internal/model"
	"log/slog"
)

type Service interface {
	Create(fields []model.FieldValue) error
	Update(fields []model.FieldValue) ([]model.FieldValue, error)
	Delete(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	DeleteByFieldIds(fieldIds []model.ID) ([]model.FieldValue, error)
	DeleteByTaskIds(taskIds []model.ID) ([]model.FieldValue, error)
	Get(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	GetByTaskIds(taskIds []model.ID) ([]model.FieldValue, error)
	GetByFieldIds(fieldIds []model.ID) ([]model.FieldValue, error)
	Logger() *slog.Logger
}
