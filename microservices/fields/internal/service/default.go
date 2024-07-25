package service

import (
	"fieldval/internal/model"
	"fieldval/internal/store"
	"log/slog"
)

var _ Service = &DefaultService{}

type DefaultService struct {
	config *Config
	logger *slog.Logger

	store store.Store
}

func NewService(store store.Store, logger *slog.Logger, config *Config) *DefaultService {
	return &DefaultService{
		logger: logger,
		config: config,
		store:  store,
	}
}

func (s *DefaultService) CreateFields(fields []model.FieldValue) error {
	return s.store.Fields().CreateFieldValues(fields)
}

func (s *DefaultService) UpdateFields(fields []model.FieldValue) ([]model.FieldValue, error) {
	return s.store.Fields().UpdateFieldValues(fields)
}

func (s *DefaultService) DeleteFields(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error) {
	return s.store.Fields().DeleteFieldValues(fieldIds)
}

func (s *DefaultService) GetFields(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error) {
	return s.store.Fields().GetFieldValues(fieldIds)
}

func (s *DefaultService) GetTaskFields(taskIds []model.ID) ([]model.FieldValue, error) {
	return s.store.Fields().GetFieldValuesForTasks(taskIds)
}

func (s *DefaultService) Logger() *slog.Logger {
	return s.logger
}
