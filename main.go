package main

import (
	"fmt"
	"math"
	"runtime"
	"unsafe"

	"github.com/go-gl/gl/v4.1-core/gl"
	"github.com/go-gl/glfw/v3.3/glfw"

	_ "embed"
)

const (
	width  = 1280
	height = 720

	ssWidth  = width * 2
	ssHeight = height * 2
)

//go:embed shaders/vertex.glsl
var vShaderSource string

//go:embed shaders/vertex-aa.glsl
var vShaderSourceAA string

//go:embed shaders/fragment.glsl
var fShaderSource string

//go:embed shaders/fragment-aa.glsl
var fShaderSourceAA string

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

	// Compile the vertex AA shader.
	vShaderAA, err := compileShader(vShaderSourceAA, gl.VERTEX_SHADER)
	if err != nil {
		panic(fmt.Errorf("error while compiling vertexAA shader: %w", err))
	}
	defer gl.DeleteShader(vShaderAA)

	// Compile the fragment AA shader.
	fShaderAA, err := compileShader(fShaderSourceAA, gl.FRAGMENT_SHADER)
	if err != nil {
		panic(fmt.Errorf("error while compiling fragmentAA shader: %w", err))
	}
	defer gl.DeleteShader(fShaderAA)

	// Create a program with the shaders attached.
	program := setupProgram(vShader, fShader)
	defer gl.DeleteProgram(program)

	// Create a program with the shaders attached.
	programAA := setupProgram(vShaderAA, fShaderAA)
	defer gl.DeleteProgram(programAA)

	gl.UseProgram(program)
	// Set up uniform variable for screen resolution.
	resolutionUni := gl.GetUniformLocation(program, gl.Str("resolution\x00"))
	gl.Uniform2f(resolutionUni, float32(width), float32(height))

	// Setup the vertices data.
	vao, vbo, size := setupVertices(program)

	// Create and bind the Framebuffer.
	var fbo uint32
	gl.GenFramebuffers(1, &fbo)
	gl.BindFramebuffer(gl.FRAMEBUFFER, fbo)

	// Create the texture.
	var tex uint32
	gl.GenTextures(1, &tex)
	gl.BindTexture(gl.TEXTURE_2D, tex)
	gl.TexImage2D(gl.TEXTURE_2D, 0, gl.RGB, ssWidth, ssHeight, 0, gl.RGB, gl.UNSIGNED_BYTE, nil)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

	// Attach the texture to the framebuffer
	gl.FramebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)

	// Check FBO status
	if gl.CheckFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE {
		panic("frame buffer is not complete")
	}

	gl.BindFramebuffer(gl.FRAMEBUFFER, 0)

	var iter int
	// Render loop.
	for !window.ShouldClose() {
		showFPS()

		gl.BindFramebuffer(gl.FRAMEBUFFER, fbo)
		gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		gl.UseProgram(program)
		gl.BindVertexArray(vao)
		gl.BindBuffer(gl.ARRAY_BUFFER, vbo)
		gl.Viewport(0, 0, ssWidth, ssHeight)
		gl.DrawArrays(gl.TRIANGLES, 0, size)
		gl.BindVertexArray(0)
		gl.BindBuffer(gl.ARRAY_BUFFER, 0)

		gl.BindFramebuffer(gl.FRAMEBUFFER, 0)
		gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		gl.UseProgram(programAA)
		gl.Viewport(0, 0, width, height)

		gl.ActiveTexture(gl.TEXTURE0)
		gl.BindTexture(gl.TEXTURE_2D, tex)
		gl.Uniform1i(gl.GetUniformLocation(programAA, gl.Str("screenTexture\x00")), 0)

		gl.BindVertexArray(vao)
		gl.BindBuffer(gl.ARRAY_BUFFER, vbo)
		gl.DrawArrays(gl.TRIANGLES, 0, size)
		gl.BindVertexArray(0)
		gl.BindBuffer(gl.ARRAY_BUFFER, 0)

		window.SwapBuffers()
		glfw.PollEvents()

		iter++
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

	return program
}

func setupVertices(program uint32) (uint32, uint32, int32) {
	vertices := []float32{
		// Positions   // Texture Coords
		-1.0, 1.0, 0.0, 1.0,
		-1.0, -1.0, 0.0, 0.0,
		1.0, -1.0, 1.0, 0.0,

		-1.0, 1.0, 0.0, 1.0,
		1.0, -1.0, 1.0, 0.0,
		1.0, 1.0, 1.0, 1.0,
	}

	var vao, vbo uint32
	gl.GenVertexArrays(1, &vao)
	gl.GenBuffers(1, &vbo)

	gl.BindVertexArray(vao)
	gl.BindBuffer(gl.ARRAY_BUFFER, vbo)
	gl.BufferData(gl.ARRAY_BUFFER, len(vertices)*4, gl.Ptr(vertices), gl.STATIC_DRAW)

	// Position attribute.
	var pa uint32 = 0
	gl.VertexAttribPointer(pa, 2, gl.FLOAT, false, 4*4, unsafe.Pointer(uintptr(0)))
	gl.EnableVertexAttribArray(pa)

	// Texture coord attribute.
	var ta uint32 = 1
	gl.VertexAttribPointer(ta, 2, gl.FLOAT, false, 4*4, unsafe.Pointer(uintptr(2*4)))
	gl.EnableVertexAttribArray(ta)

	gl.BindBuffer(gl.ARRAY_BUFFER, 0)
	gl.BindVertexArray(0)

	return vao, vbo, 6
}

// lastTime is required to calculated FPS.
var lastTime float64

// showFPS prints the FPS to the standard output.
// It should be called inside the window.ShouldClose loop.
func showFPS() {
	currentTime := glfw.GetTime()
	deltaTime := currentTime - lastTime
	lastTime = currentTime
	fmt.Printf("\rFPS: %v ###", math.Ceil(1.0/deltaTime))
}

func checkErr(id any) {
	if err := gl.GetError(); err != gl.NO_ERROR {
		panic(fmt.Errorf("[%v] error in opengl: %d", id, err))
	}
}
