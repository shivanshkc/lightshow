app_name = illuminate

render: build
	@echo "+$@"
	@bin/$(app_name)

build:
	@echo "+$@"
	@go build \
		-ldflags="-s -w" \
		-o bin/$(app_name) \
		cmd/$(app_name)/main.go
