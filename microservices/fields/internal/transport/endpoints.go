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

type CreateRequest struct {
	Fields []model.FieldValue `json:"fields" validate:"required,min=1"`
}

type CreateResponse struct {
	Result bool `json:"result"`
}

func NewCreateEndpoint(s service.Service) Endpoint[CreateRequest, CreateResponse] {
	return func(req CreateRequest) (CreateResponse, error) {
		err := s.Create(req.Fields)
		return CreateResponse{Result: err == nil}, err
	}
}

type UpdateRequest struct {
	Fields []model.FieldValue `json:"fields" validate:"required,min=1"`
}

type UpdateResponse struct {
	Fields []model.FieldValue `json:"fields"`
}

func NewUpdateEndpoint(s service.Service) Endpoint[UpdateRequest, UpdateResponse] {
	return func(req UpdateRequest) (UpdateResponse, error) {
		fields, err := s.Update(req.Fields)
		if err != nil {
			return UpdateResponse{}, err
		}
		return UpdateResponse{Fields: fields}, nil
	}
}

type DeleteRequest struct {
	FieldIds []model.FieldValuePrimaryKeys `json:"fieldIds" validate:"required,min=1"`
}

type DeleteResponse struct {
	Fields []model.FieldValue `json:"fields"`
}

func NewDeleteEndpoint(s service.Service) Endpoint[DeleteRequest, DeleteResponse] {
	return func(req DeleteRequest) (DeleteResponse, error) {
		fields, err := s.Delete(req.FieldIds)
		if err != nil {
			return DeleteResponse{}, err
		}

		return DeleteResponse{Fields: fields}, err
	}
}

type DeleteByTaskIdsRequest struct {
	Ids []model.ID `json:"taskIds" validate:"required,min=1"`
}

type DeleteByTaskIdsResponse struct {
	Fields []model.FieldValue `json:"fields"`
}

func NewDeleteByTaskIdsEndpoint(s service.Service) Endpoint[DeleteByTaskIdsRequest, DeleteByTaskIdsResponse] {
	return func(req DeleteByTaskIdsRequest) (DeleteByTaskIdsResponse, error) {
		fields, err := s.DeleteByTaskIds(req.Ids)
		if err != nil {
			return DeleteByTaskIdsResponse{}, err
		}

		return DeleteByTaskIdsResponse{Fields: fields}, nil
	}
}

type DeleteByFieldIdsRequest struct {
	Ids []model.ID `json:"fieldIds" validate:"required,min=1"`
}

type DeleteByFieldIdsResponse struct {
	Fields []model.FieldValue `json:"fields"`
}

func NewDeleteByFieldIdsEndpoint(s service.Service) Endpoint[DeleteByFieldIdsRequest, DeleteByFieldIdsResponse] {
	return func(req DeleteByFieldIdsRequest) (DeleteByFieldIdsResponse, error) {
		fields, err := s.DeleteByFieldIds(req.Ids)
		if err != nil {
			return DeleteByFieldIdsResponse{}, err
		}

		return DeleteByFieldIdsResponse{Fields: fields}, nil
	}
}

type GetRequest struct {
	FieldIds []model.FieldValuePrimaryKeys `json:"fieldIds" validate:"required,min=1"`
}

type GetResponse struct {
	Fields []model.FieldValue `json:"fields"`
}

func NewGetEndpoint(s service.Service) Endpoint[GetRequest, GetResponse] {
	return func(req GetRequest) (GetResponse, error) {
		fields, err := s.Get(req.FieldIds)
		if err != nil {
			return GetResponse{}, err
		}
		return GetResponse{Fields: fields}, nil
	}
}

type GetByTaskIdsRequest struct {
	TaskIds []model.ID `json:"taskIds" validate:"required,min=1"`
}

type GetByTaskIdsResponse struct {
	Fields []model.FieldValue `json:"fields"`
}

func NewGetByTaskIdsEndpoint(s service.Service) Endpoint[GetByTaskIdsRequest, GetByTaskIdsResponse] {
	return func(req GetByTaskIdsRequest) (GetByTaskIdsResponse, error) {
		fields, err := s.GetByTaskIds(req.TaskIds)
		if err != nil {
			return GetByTaskIdsResponse{}, err
		}
		return GetByTaskIdsResponse{Fields: fields}, nil
	}
}

type GetByFieldIdsRequest struct {
	Ids []model.ID `json:"fieldIds" validate:"required,min=1"s`
}

type GetByFieldIdsResponse struct {
	Fields []model.FieldValue `json:"fields"`
}

func NewGetByFieldIdsEndpoint(s service.Service) Endpoint[GetByFieldIdsRequest, GetByFieldIdsResponse] {
	return func(req GetByFieldIdsRequest) (GetByFieldIdsResponse, error) {
		fields, err := s.GetByFieldIds(req.Ids)
		if err != nil {
			return GetByFieldIdsResponse{}, err
		}

		return GetByFieldIdsResponse{Fields: fields}, nil
	}
}
