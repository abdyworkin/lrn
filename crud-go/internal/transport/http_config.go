package transport

type HttpConfig struct {
	BindAddress string `toml:"bind_address"`
}

func NewHttpConfig() *HttpConfig {
	return &HttpConfig{
		BindAddress: "",
	}
}
