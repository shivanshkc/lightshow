# Lightshow

A Go-based application designed to render complex light and shape interactions. The project includes a modular 
architecture with key packages for rendering, shape handling, materials, and randomization utilities.

![Render](https://github.com/shivanshkc/lightshow/blob/main/showcase/image.jpg)

## Features

- Efficient use of Goroutines with worker pooling for faster renders.
- CPU profiling to locate performance bottlenecks.
- Optimizations using Bounding Volume Hierarchies.
- Configurable materials (matte, metallic, glass).
- Camera system for scene manipulation.
- Randomization utilities for generating variations in rendering.

## Project Structure

```
lightshow/
│
├── cmd/
│   └── lightshow/
│       └── main.go          # Entry point of the application
│
├── pkg/
│   ├── camera/              # Camera management
│   ├── mats/                # Materials for rendering
│   ├── renderer/            # Rendering engine and helpers
│   ├── shapes/              # Shape definitions (spheres, BVH, etc.)
│   ├── utils/               # Utility functions (ray, color, vector operations)
│   └── random/              # Randomization utilities
│
├── dist/                    # Output directory for rendered images
├── .github/                 # GitHub Actions workflows for CI/CD
├── Makefile                 # Build automation
├── go.mod                   # Go module definition
├── go.sum                   # Module dependency checksums
└── .golangci.yaml           # Linter configuration
```

## Prerequisites

- [Go](https://golang.org/) (version 1.19 or higher)
- Make (optional, for build automation)

## Setup and Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/shivanshkc/lightshow.git
   cd lightshow
   ```

2. Install dependencies:
   ```sh
   go mod tidy
   ```

3. Run the application:
   ```sh
   go run cmd/lightshow/main.go
   ```

## Development

- Follow the coding style defined in `.golangci.yaml`.
- Use the Makefile for common tasks, such as building and testing.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.