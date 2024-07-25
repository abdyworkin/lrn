package transport

import (
	"fieldval/internal/model"
	"fieldval/internal/service"
)

type ErrorResponse struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type Endpoint[Request any, Response any] func(Request) (Response, error)

type CreateFieldsRequest struct {
	Fields []model.FieldValue `json:"fields" validate:"required,min=1"`
}

type CreateFieldsResponse struct {
	Result bool `json:"result"`
}

func NewCreateFieldsEndpoint(s service.Service) Endpoint[CreateFieldsRequest, CreateFieldsResponse] {
	return func(req CreateFieldsRequest) (CreateFieldsResponse, error) {
		err := s.CreateFields(req.Fields)
		return CreateFieldsResponse{Result: err == nil}, err
	}
}

type UpdateFieldsRequest struct {
	Fields []model.FieldValue `json:"fields" validate:"required,min=1"`
}

type UpdateFieldsResponse struct {
	Fields []model.FieldValue `json:"result"`
}

func NewUpdateFieldsEndpoint(s service.Service) Endpoint[UpdateFieldsRequest, UpdateFieldsResponse] {
	return func(req UpdateFieldsRequest) (UpdateFieldsResponse, error) {
		fields, err := s.UpdateFields(req.Fields)
		if err != nil {
			return UpdateFieldsResponse{}, err
		}
		return UpdateFieldsResponse{Fields: fields}, nil
	}
}

type DeleteFieldsRequest struct {
	FieldIds []model.FieldValuePrimaryKeys `json:"fieldIds" validate:"required,min=1"`
}

type DeleteFieldsResponse struct {
	Fields []model.FieldValue `json:"result"`
}

func NewDeleteFieldsEndpoint(s service.Service) Endpoint[DeleteFieldsRequest, DeleteFieldsResponse] {
	return func(req DeleteFieldsRequest) (DeleteFieldsResponse, error) {
		fields, err := s.DeleteFields(req.FieldIds)
		if err != nil {
			return DeleteFieldsResponse{}, err
		}

		return DeleteFieldsResponse{Fields: fields}, err
	}
}

type GetFieldsRequest struct {
	FieldIds []model.FieldValuePrimaryKeys `json:"fieldIds" validate:"required,min=1"`
}

type GetFieldsResponse struct {
	Fields []model.FieldValue `json:"result"`
}

func NewGetFieldsEndpoint(s service.Service) Endpoint[GetFieldsRequest, GetFieldsResponse] {
	return func(req GetFieldsRequest) (GetFieldsResponse, error) {
		fields, err := s.GetFields(req.FieldIds)
		if err != nil {
			return GetFieldsResponse{}, err
		}
		return GetFieldsResponse{Fields: fields}, nil
	}
}

type GetTaskFieldsRequest struct {
	TaskIds []model.ID `json:"taskIds" validate:"required,min=1"`
}

type GetTaskFieldsResponse struct {
	Fields []model.FieldValue `json:"result"`
}

func NewGetTaskFieldsEndpoint(s service.Service) Endpoint[GetTaskFieldsRequest, GetTaskFieldsResponse] {
	return func(req GetTaskFieldsRequest) (GetTaskFieldsResponse, error) {
		fields, err := s.GetTaskFields(req.TaskIds)
		if err != nil {
			return GetTaskFieldsResponse{}, err
		}
		return GetTaskFieldsResponse{Fields: fields}, nil
	}
}
