package rmq

import (
	"fieldval/internal/transport"
	"log/slog"
)

func pipe[Request any, Response any](
	decoder func(data []byte) (Request, error),
	endpoint func(Request) (Response, error),
	encoder func(interface{}) ([]byte, error),
	logger *slog.Logger,
) RabbitHandler {
	return func(requestData []byte) []byte {
		request, err := decoder(requestData)
		if err != nil {
			logger.Debug("Failed decode request", "error", err.Error())
			return transport.EncodeError(err)
		}

		err = transport.ValidateRequest(request)
		if err != nil {
			logger.Debug("Failed validate request", "error", err.Error())
			return transport.EncodeError(err)
		}

		response, err := endpoint(request)
		if err != nil {
			logger.Error("Failed process request", "error", err.Error())
			return transport.EncodeError(err)
		}

		responseData, err := encoder(response)
		if err != nil {
			logger.Error("Failed encode response", "error", err.Error())
			return transport.EncodeError(err)
		}

		return responseData
	}
}
