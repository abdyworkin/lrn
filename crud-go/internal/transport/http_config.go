package transport

type HttpConfig struct {
	BindAddress string
}

func NewHttpConfig() *HttpConfig {
	return &HttpConfig{
		BindAddress: "",
	}
}
