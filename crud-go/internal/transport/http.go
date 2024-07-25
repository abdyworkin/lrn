package transport

import (
	"crud/internal/service"
	"crud/internal/store"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"
)

type HttpServer struct {
	config  *HttpConfig
	logger  *slog.Logger
	router  *mux.Router
	service service.ITodoService
}

func NewHttpServer(logger *slog.Logger, store store.Store, config *HttpConfig, serviceConfig *service.Config) *HttpServer {
	return &HttpServer{
		config:  config,
		logger:  logger,
		router:  mux.NewRouter(),
		service: service.NewTodoService(logger, store, serviceConfig),
	}
}

func (s *HttpServer) Start() error {
	s.logger.Info(`Starting API server`, "bind_address", s.config.BindAddress)

	s.createEndpoints()

	return http.ListenAndServe(s.config.BindAddress, s.router)
}

func (s *HttpServer) createEndpoints() {
	s.router.HandleFunc("/get", pipe[GetTodosRequest, GetTodosResponse](
		decodeRequest,
		func(req *GetTodosRequest) (GetTodosResponse, error) { // Это контроллер и его стоит поместить в отдельный файл
			s.logger.Debug("GetTodosRequest", "ids", req.Ids)
			todos, err := s.service.GetTodos(req.Ids)
			return GetTodosResponse{Todos: todos}, err
		},
		encodeResponse,
		s.logger,
	)).Methods("GET")

	s.router.HandleFunc("/create", pipe[CreateTodoRequest, CreateTodoResponse](
		decodeRequest,
		func(req *CreateTodoRequest) (CreateTodoResponse, error) {
			s.logger.Debug("CreateTodoRequest", "title", req.Title)
			todo, err := s.service.CreateTodo(req.Title)
			return CreateTodoResponse{Todo: *todo}, err
		},
		encodeResponse,
		s.logger,
	)).Methods("POST")

	s.router.HandleFunc("/toggle", pipe[ToggleTodoRequest, ToggleTodoResponse](
		decodeRequest,
		func(req *ToggleTodoRequest) (ToggleTodoResponse, error) {
			s.logger.Debug("ToggleTodoRequest", "id", req.Id)
			todo, err := s.service.ToggleTodo(req.Id)
			return ToggleTodoResponse{Todo: *todo}, err
		},
		encodeResponse,
		s.logger,
	)).Methods("POST")

	s.router.HandleFunc("/update", pipe[UpdateTodoRequest, UpdateTodoResponse](
		decodeRequest,
		func(req *UpdateTodoRequest) (UpdateTodoResponse, error) {
			s.logger.Debug("UpdateTodoRequest", "id", req.Id)
			todo, err := s.service.UpdateTodo(req.Id, req.Title, req.Complete)
			return UpdateTodoResponse{Todo: *todo}, err
		},
		encodeResponse,
		s.logger,
	)).Methods("POST")

	s.router.HandleFunc("/delete", pipe[DeleteTodoRequest, DeleteTodoResponse](
		decodeRequest,
		func(req *DeleteTodoRequest) (DeleteTodoResponse, error) {
			s.logger.Debug("DeleteTodoRequest", "id", req.Id)
			todo, err := s.service.DeleteTodo(req.Id)
			return DeleteTodoResponse{Todo: *todo}, err
		},
		encodeResponse,
		s.logger,
	)).Methods("POST")
}
