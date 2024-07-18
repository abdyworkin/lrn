package transport

import (
	"crud/internal/model"
	"encoding/json"
	"net/http"
)

func pipe[Request any, Response any](
	decoder func(*http.Request) (*Request, error),
	endpoint func(*Request) (Response, error),
	encoder func(data interface{}) ([]byte, error),
) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		decoded, err := decoder(r)
		if err != nil {
			w.Header().Set("status", "400")
			w.Write([]byte("Error while decode incoming request"))
			return
		}

		response, err := endpoint(decoded)
		if err != nil {
			w.Header().Set("status", "500")
			w.Write([]byte(err.Error()))
			return
		}

		encoded, err := encoder(response)
		if err != nil {
			w.Header().Set("status", "500")
			w.Write([]byte("Error while encode response"))
			return
		}

		w.Header().Set("status", "200")
		w.Write(encoded)
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

type GetTodosRequest struct {
	Ids []model.ID `json:"ids"`
}

type GetTodosResponse struct {
	Todos []model.Todo `json:"todos"`
}

type CreateTodoRequest struct {
	Title string `json:"title"`
}

type CreateTodoResponse struct {
	Todo model.Todo `json:"todo"`
}

type ToggleTodoRequest struct {
	Id model.ID `json:"id"`
}

type ToggleTodoResponse struct {
	Todo model.Todo `json:"todo"`
}

type UpdateTodoRequest struct {
	Id       model.ID `json:"id"`
	Title    string   `json:"title"`
	Complete bool     `json:"complete"`
}

type UpdateTodoResponse struct {
	Todo model.Todo `json:"todo"`
}

type DeleteTodoRequest struct {
	Id model.ID `json:"id"`
}

type DeleteTodoResponse struct {
	Todo model.Todo `json:"todo"`
}
