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

func (s *DefaultService) Create(fields []model.FieldValue) error {
	return s.store.Fields().Create(fields)
}

func (s *DefaultService) Update(fields []model.FieldValue) error {
	return s.store.Fields().Update(fields)
}

func (s *DefaultService) Delete(fieldIds []model.FieldValuePrimaryKeys) error {
	return s.store.Fields().Delete(fieldIds)
}

func (s *DefaultService) Get(fieldIds []model.FieldValuePrimaryKeys) ([]model.FieldValue, error) {
	return s.store.Fields().Get(fieldIds)
}

// DeleteByFieldIds implements Service.
func (s *DefaultService) DeleteByFieldIds(fieldIds []model.ID) error {
	return s.store.Fields().DeleteByFields(fieldIds)
}

// DeleteByTaskIds implements Service.
func (s *DefaultService) DeleteByTaskIds(taskIds []model.ID) error {
	return s.store.Fields().DeleteByTasks(taskIds)
}

// GetByFieldIds implements Service.
func (s *DefaultService) GetByFieldIds(fieldIds []model.ID) ([]model.FieldValue, error) {
	return s.store.Fields().GetByFields(fieldIds)
}

// GetByTaskIds implements Service.
func (s *DefaultService) GetByTaskIds(taskIds []model.ID) ([]model.FieldValue, error) {
	return s.store.Fields().GetByTaskIds(taskIds)
}

func (s *DefaultService) Logger() *slog.Logger {
	return s.logger
}
