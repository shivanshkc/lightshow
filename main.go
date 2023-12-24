package main

import (
	"fmt"
	"runtime"

	"github.com/go-gl/gl/v4.1-core/gl"
	"github.com/go-gl/glfw/v3.3/glfw"

	_ "embed"
)

const (
	width  = 1280
	height = 720
)

//go:embed shaders/vertex.glsl
var vShaderSource string

//go:embed shaders/fragment.glsl
var fShaderSource string

func main() {
	// This call ensures that all OpenGL calls are done from the main thread.
	runtime.LockOSThread()

	// Initiate glfw. A window context is mandatory for OpenGL to work.
	if err := glfw.Init(); err != nil {
		panic(fmt.Errorf("error in glfw.Init call: %w", err))
	}
	defer glfw.Terminate()

	// Create the window.
	glfw.WindowHint(glfw.Resizable, glfw.False)
	window, err := glfw.CreateWindow(width, height, "Lightshow", nil, nil)
	if err != nil {
		panic(fmt.Errorf("error in glfw.CreateWindow call: %w", err))
	}
	window.MakeContextCurrent()

	// Initiate OpenGL.
	if err := gl.Init(); err != nil {
		panic(fmt.Errorf("error in gl.Init call: %w", err))
	}

	// Compile the vertex shader.
	vShader, err := compileShader(vShaderSource, gl.VERTEX_SHADER)
	if err != nil {
		panic(fmt.Errorf("error while compiling vertex shader: %w", err))
	}
	defer gl.DeleteShader(vShader)

	// Compile the fragment shader.
	fShader, err := compileShader(fShaderSource, gl.FRAGMENT_SHADER)
	if err != nil {
		panic(fmt.Errorf("error while compiling fragment shader: %w", err))
	}
	defer gl.DeleteShader(fShader)

	// Create a program with the shaders attached.
	program := setupProgram(vShader, fShader)
	defer gl.DeleteProgram(program)

	// Setup the vertices data.
	vertices := setupVertices(program)

	// Set up uniform variable for screen resolution.
	resolutionUni := gl.GetUniformLocation(program, gl.Str("resolution\x00"))
	gl.Uniform2f(resolutionUni, float32(width), float32(height))

	// Render loop.
	for !window.ShouldClose() {
		// Clear screen upon every frame.
		gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		// Draw the gradient.
		gl.DrawArrays(gl.TRIANGLE_STRIP, 0, int32(len(vertices)/2))

		window.SwapBuffers()
		glfw.PollEvents()
	}
}

// compileShader compiles the given shader as per the given type.
func compileShader(source string, shaderType uint32) (uint32, error) {
	// Create a shader of the given type.
	shader := gl.CreateShader(shaderType)

	// Convert the shader source string to a C string.
	cSources, free := gl.Strs(source + "\x00")
	// Set the shader source code.
	gl.ShaderSource(shader, 1, cSources, nil)
	// Free the memory of the C string after usage.
	free()

	// Attempt to compile the shader.
	gl.CompileShader(shader)

	// Check if the shader compiled successfully.
	var status int32
	if gl.GetShaderiv(shader, gl.COMPILE_STATUS, &status); status == gl.FALSE {
		// Shader compilation failed. Attempt to retrieve failure log.
		var logLength int32
		gl.GetShaderiv(shader, gl.INFO_LOG_LENGTH, &logLength)

		// Load the failure message into CPU variable.
		logMessage := make([]byte, logLength)
		gl.GetShaderInfoLog(shader, logLength, nil, &logMessage[0])

		return 0, fmt.Errorf("shader compilation error: %v", string(logMessage))
	}

	return shader, nil
}

func setupProgram(vShader, fShader uint32) uint32 {
	program := gl.CreateProgram()

	gl.AttachShader(program, vShader)
	gl.AttachShader(program, fShader)

	gl.LinkProgram(program)
	gl.UseProgram(program)

	return program
}

func setupVertices(program uint32) []float32 {
	// Set up vertex data.
	vertices := []float32{
		-1.0, -1.0,
		+1.0, -1.0,
		-1.0, +1.0,
		+1.0, +1.0,
	}

	var vao, vbo uint32
	gl.GenVertexArrays(1, &vao)
	gl.BindVertexArray(vao)

	gl.GenBuffers(1, &vbo)
	gl.BindBuffer(gl.ARRAY_BUFFER, vbo)
	gl.BufferData(gl.ARRAY_BUFFER, 4*len(vertices), gl.Ptr(vertices), gl.STATIC_DRAW)

	// Set the position attribute in the vertex shader.
	positionAttrib := uint32(gl.GetAttribLocation(program, gl.Str("position\x00")))
	gl.EnableVertexAttribArray(positionAttrib)
	gl.VertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, nil)

	return vertices
}
