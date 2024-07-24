package endpoints

import (
	"auth/service"
	"context"

	"github.com/go-kit/kit/endpoint"
)

type Endpoints struct {
	SignUpEndpoint        endpoint.Endpoint
	SignInEndpoint        endpoint.Endpoint
	ValidateTokenEndpoint endpoint.Endpoint
	GetUsersByIdEndpoint  endpoint.Endpoint
}

func MakeSignUpEndpoint(serv service.AuthService) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (interface{}, error) {
		req := request.(SignUpRequest)
		token, err := serv.SignUp(req.Username, req.Password)
		if err != nil {
			return nil, err
		}
		return SignUpResponse{Token: token}, nil
	}
}

func MakeSignInEndpoint(serv service.AuthService) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (response interface{}, err error) {
		req := request.(SignInRequest)
		token, err := serv.SignIn(req.Username, req.Password)
		if err != nil {
			return nil, err
		}
		return SignInResponse{Token: token}, nil
	}
}

func MakeValidateEndpoint(serv service.AuthService) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (response interface{}, err error) {
		req := request.(ValidateTokenRequest)
		id, err := serv.ValidateToken(req.Token)
		if err != nil {
			return nil, err
		}
		return ValidateTokenResponse{Id: id}, nil
	}
}

func MakeGetUsersByIdEndpoint(serv service.AuthService) endpoint.Endpoint {
	return func(ctx context.Context, request interface{}) (response interface{}, err error) {
		req := request.(GetUsersByIdRequest)
		users, err := serv.GetUsersById(req.Ids)
		if err != nil {
			return nil, err
		}

		responseUsers := make([]ResponseUser, len(users))
		for i := range users {
			responseUsers[i] = ResponseUser{
				Id:       users[i].ID,
				Username: users[i].Username,
			}
		}

		return GetUsersByIdResponse{Users: responseUsers}, nil
	}
}

type SignUpRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type SignUpResponse struct {
	Token string `json:"token"`
}

type SignInRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type SignInResponse struct {
	Token string `json:"token"`
}

type ValidateTokenRequest struct {
	Token string `json:"token"`
}

type ValidateTokenResponse struct {
	Id uint `json:"id"`
}

type GetUsersByIdRequest struct {
	Ids []uint `json:"ids"`
}

type ResponseUser struct {
	Id       uint   `json:"id"`
	Username string `json:"username"`
}

type GetUsersByIdResponse struct {
	Users []ResponseUser `json:"users"`
}
