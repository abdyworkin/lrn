package transport

import (
	"crud/internal/model"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func pipe[Request any, Response any](
	decoder func(*http.Request) (*Request, error),
	endpoint func(*Request) (Response, error),
	encoder func(data interface{}) ([]byte, error),
	logger *slog.Logger,
) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Debug("Piping request")

		w.Header().Set("Content-Type", "application/json")

		decoded, err := decoder(r)
		if err != nil {
			logger.Debug("Request parse error", "error", err.Error())
			w.Header().Set("status", "400")
			w.Write([]byte("Error while decode incoming request"))
			return
		}

		if err := validateRequest(decoded); err != nil {
			logger.Debug("Request validate error", "error", err.Error())
			w.Header().Set("status", "400")
			w.Write([]byte("Invalid request " + err.Error()))
			return
		}

		response, err := endpoint(decoded)
		if err != nil {
			logger.Debug("Request process error", "error", err.Error())
			w.Header().Set("status", "500")
			w.Write([]byte(err.Error()))
			return
		}

		encoded, err := encoder(response)
		if err != nil {
			logger.Debug("Generating response string error", "error", err.Error())
			w.Header().Set("status", "500")
			w.Write([]byte("Error while encode response"))
			return
		}

		w.Header().Set("status", "200")
		w.Write(encoded)

		logger.Debug("Request processed succesfully")
	}
}

func decodeRequest[T any](r *http.Request) (*T, error) {
	req := new(T)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return nil, err
	}

	return req, nil
}

func encodeResponse(response interface{}) ([]byte, error) {
	return json.Marshal(response)
}

func validateRequest(req interface{}) error {
	return validate.Struct(req)
}

type GetTodosRequest struct {
	Ids []model.ID `json:"ids" validate:"required"`
}

type GetTodosResponse struct {
	Todos []model.Todo `json:"todos"`
}

type CreateTodoRequest struct {
	Title string `json:"title" validate:"required,min=3,max=30"`
}

type CreateTodoResponse struct {
	Todo model.Todo `json:"todo"`
}

type ToggleTodoRequest struct {
	Id model.ID `json:"id" validate:"required,min=1"`
}

type ToggleTodoResponse struct {
	Todo model.Todo `json:"todo"`
}

type UpdateTodoRequest struct {
	Id       model.ID `json:"id" validate:"required,min=1"`
	Title    *string  `json:"title,omitempty" validate:"omitempty,min=3,max=30"`
	Complete *bool    `json:"complete,omitempty" validate:"omitempty"`
}

type UpdateTodoResponse struct {
	Todo model.Todo `json:"todo"`
}

type DeleteTodoRequest struct {
	Id model.ID `json:"id" validate:"required,min=1"`
}

type DeleteTodoResponse struct {
	Todo model.Todo `json:"todo"`
}
