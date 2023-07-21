SHELL=/usr/bin/env bash

app_name = illuminate

# Renders the image.
render: tidy build
	@echo "+$@"
	@bin/$(app_name)

# Builds the program.
build:
	@echo "+$@"
	@go build -o bin/$(app_name) cmd/$(app_name)/main.go

# Tests the whole project.
test:
	@echo "+$@"
	@CGO_ENABLED=1 go test -race -coverprofile=coverage.out -covermode=atomic ./...

# Runs the "go mod tidy" command.
tidy:
	@echo "+$@"
	@go mod tidy

# Runs golang-ci-lint over the project.
lint:
	@echo "+$@"
	@golangci-lint run ./...
