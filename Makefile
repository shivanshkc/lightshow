SHELL=/usr/bin/env bash

app_name = lightshow

# Renders the image.
render: build
	@echo "+$@"
	@bin/$(app_name)

# Builds the program.
build:
	@echo "+$@"
	@gcc -o bin/$(app_name) main.c
