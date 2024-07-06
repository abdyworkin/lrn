package transport

import (
	"auth/endpoints"
	"context"
	"encoding/json"
	"errors"
	"net/http"

	_ "auth/docs"

	httptransport "github.com/go-kit/kit/transport/http"
	httpSwagger "github.com/swaggo/http-swagger"
)

func NewHTTPHandler(endpoints endpoints.Endpoints) http.Handler {
	mux := http.NewServeMux()

	mux.Handle("/signup", postOnly(httptransport.NewServer(
		endpoints.SignUpEndpoint,
		decodeSignUpRequest,
		encodeResponse,
	)))

	mux.Handle("/signin", postOnly(httptransport.NewServer(
		endpoints.SignInEndpoint,
		decodeSignInRequest,
		encodeResponse,
	)))

	mux.Handle("/validate", postOnly(httptransport.NewServer(
		endpoints.ValidateTokenEndpoint,
		decodeValidateRequest,
		encodeResponse,
	)))

	mux.Handle("/getusers", postOnly(httptransport.NewServer(
		endpoints.GetUsersByIdEndpoint,
		decodeGetUsersByIdRequest,
		encodeResponse,
	)))

	mux.HandleFunc("/swagger/", httpSwagger.WrapHandler)

	return mux
}

func postOnly(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}
		h.ServeHTTP(w, r)
	})
}

// @Summary Регистрация
// @Description Создает нового пользователя и возвращает авторизационный токен
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   request body endpoints.SignUpRequest true "Sign Up Request"
// @Success 200 {object} endpoints.SignUpResponse
// @Router /signup [post]
func decodeSignUpRequest(ctx context.Context, r *http.Request) (interface{}, error) {
	var request endpoints.SignUpRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return nil, err
	}

	// Проверка обязательных полей
	if request.Username == "" || request.Password == "" {
		return nil, errors.New("username and password are required")
	}

	return request, nil
}

// @Summary Аутентификация
// @Description Аутентификация пользователя и возврат JWT токена
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   request body endpoints.SignInRequest true "Sign In Request"
// @Success 200 {object} endpoints.SignInResponse
// @Router /signin [post]
func decodeSignInRequest(ctx context.Context, r *http.Request) (interface{}, error) {
	var request endpoints.SignInRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return nil, err
	}

	// Проверка обязательных полей
	if request.Username == "" || request.Password == "" {
		return nil, errors.New("username and password are required")
	}

	return request, nil
}

// @Summary Авторизация
// @Description Проверка валидности JWT токена
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   request body endpoints.ValidateTokenRequest true "Validate Token Request"
// @Success 200 {object} endpoints.ValidateTokenResponse
// @Router /validate [post]
func decodeValidateRequest(ctx context.Context, r *http.Request) (interface{}, error) {
	var request endpoints.ValidateTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return nil, err
	}

	// Проверка обязательных полей
	if request.Token == "" {
		return nil, errors.New("token is required")
	}

	return request, nil
}

// @Summary Получение пользователей
// @Description Получение пользователей по их ID
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   request body endpoints.GetUsersByIdRequest true "Get Users By Id Request"
// @Success 200 {object} endpoints.GetUsersByIdResponse
// @Router /getusers [post]
func decodeGetUsersByIdRequest(ctx context.Context, r *http.Request) (interface{}, error) {
	var request endpoints.GetUsersByIdRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return nil, err
	}

	// Проверка обязательных полей
	if len(request.Ids) == 0 {
		return nil, errors.New("ids are required")
	}

	return request, nil
}

func encodeResponse(ctx context.Context, w http.ResponseWriter, response interface{}) error {
	return json.NewEncoder(w).Encode(response)
}
