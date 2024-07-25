package transport

import (
	"encoding/json"

	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func JsonDecoder[T any](data []byte) (T, error) {
	var t T
	err := json.Unmarshal(data, &t)
	return t, err
}

func JsonEncoder(data interface{}) ([]byte, error) {
	return json.Marshal(data)
}

func EncodeError(err error) []byte {
	data, err := json.Marshal(ErrorResponse{Type: "error", Message: err.Error()})
	if err != nil {
		return []byte(`{"type": "error", "message": "Marshal message error" }`)
	}

	return data
}

func ValidateRequest(request interface{}) error {
	return validate.Struct(request)
}
