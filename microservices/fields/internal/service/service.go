package service

import (
	"fieldval/internal/model"
	"log/slog"
)

type Service interface {
	CreateFields(fields []model.FieldValue) error
	UpdateFields(fields []model.FieldValue) ([]model.FieldValue, error)
	DeleteFields(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	GetFields(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error)
	GetTaskFields(taskIds []model.ID) ([]model.FieldValue, error)
	Logger() *slog.Logger
}
