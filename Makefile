SHELL=/usr/bin/env bash

app_name = lightshow
pprof_addr = http://localhost:6060

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

# Shows the goroutine block profiling data.
blockprof:
	@echo "+$@"
	@mkdir pprof || true
	@curl $(pprof_addr)/debug/pprof/block > pprof/block.prof && \
		go tool pprof --text bin/$(app_name) pprof/block.prof

# Shows the mutex usage data.
mutexprof:
	@echo "+$@"
	@mkdir pprof || true
	@curl $(pprof_addr)/debug/pprof/mutex > pprof/mutex.prof && \
		go tool pprof --text bin/$(app_name) pprof/mutex.prof

# Shows the heap allocation data.
heapprof:
	@echo "+$@"
	@mkdir pprof || true
	@curl $(pprof_addr)/debug/pprof/heap > pprof/heap.prof && \
		go tool pprof --text bin/$(app_name) pprof/heap.prof

# Shows execution time per function.
prof:
	@echo "+$@"
	@mkdir pprof || true
	@curl $(pprof_addr)/debug/pprof/profile?seconds=30 > pprof/profile.prof && \
		go tool pprof --text bin/$(app_name) pprof/profile.prof
