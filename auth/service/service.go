package service

import (
	"auth/model"
	"errors"
	"time"

	"github.com/dgrijalva/jwt-go"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("Invalid credentials")
	ErrUserExists         = errors.New("User already exists")
)

type AuthService interface {
	SignUp(username, password string) (string, error)
	SignIn(username, password string) (string, error)
	ValidateToken(token string) (uint, error)
	GetUsersById(ids []uint) ([]model.User, error)
}

var _ authService = authService{}

type authService struct {
	db        *gorm.DB
	jwtSecret string
}

func NewService(db *gorm.DB, jwtSecret string) AuthService {
	return &authService{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

func (s *authService) SignUp(username, password string) (string, error) {
	var user model.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err == nil {
		return "", ErrUserExists
	}

	user = model.User{
		Username: username,
		Password: password,
	}
	s.db.Create(&user)
	return s.createToken(user.ID)
}

func (s *authService) SignIn(username, password string) (string, error) {
	var user model.User
	if err := s.db.Where("username = ? AND password = ?", username, password).First(&user).Error; err != nil {
		return "", ErrInvalidCredentials
	}
	return s.createToken(user.ID)
}

func (s *authService) ValidateToken(token string) (uint, error) {
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return 0, err
	}

	if claims, ok := parsedToken.Claims.(jwt.MapClaims); ok && parsedToken.Valid {
		userID := claims["user_id"].(float64)
		return uint(userID), nil
	}

	return 0, errors.New("invalid token")
}

func (s *authService) GetUsersById(ids []uint) ([]model.User, error) {
	var users []model.User
	if err := s.db.Where("id IN (?)", ids).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (s *authService) createToken(userID uint) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})
	return token.SignedString([]byte(s.jwtSecret))
}
