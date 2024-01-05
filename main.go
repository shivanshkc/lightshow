package main

import (
	_ "embed"
	"fmt"
	"log"
	"math"
	"runtime"
	"strings"
	"unsafe"

	"github.com/go-gl/gl/v4.6-core/gl"
	"github.com/go-gl/glfw/v3.3/glfw"
)

//go:embed shaders/compute.glsl
var computeShaderSource string

//go:embed shaders/vertex.glsl
var vertexShaderSource string

//go:embed shaders/fragment.glsl
var fragmentShaderSource string

const (
	windowWidth  = 1280
	windowHeight = 720
)

func init() {
	runtime.LockOSThread()
}

func main() {
	if err := glfw.Init(); err != nil {
		log.Fatalln("failed to initialize glfw:", err)
	}
	defer glfw.Terminate()

	glfw.WindowHint(glfw.ContextVersionMajor, 4)
	glfw.WindowHint(glfw.ContextVersionMinor, 6)
	glfw.WindowHint(glfw.OpenGLProfile, glfw.OpenGLCoreProfile)
	glfw.WindowHint(glfw.OpenGLForwardCompatible, glfw.True)

	window, err := glfw.CreateWindow(windowWidth, windowHeight, "Compute Shader", nil, nil)
	if err != nil {
		log.Fatalln("failed to create window:", err)
	}

	window.MakeContextCurrent()

	if err := gl.Init(); err != nil {
		log.Fatalln("failed to initialize opengl:", err)
	}

	computeProgram := initComputeShader()
	renderProgram := initRenderShader()

	var texture uint32
	gl.GenTextures(1, &texture)
	gl.BindTexture(gl.TEXTURE_2D, texture)
	gl.TexImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, windowWidth, windowHeight, 0, gl.RGBA, gl.FLOAT, nil)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
	gl.BindImageTexture(0, texture, 0, false, 0, gl.READ_WRITE, gl.RGBA32F)

	for !window.ShouldClose() {
		showFPS()
		glfw.PollEvents()

		// Run the compute shader
		gl.UseProgram(computeProgram)
		gl.DispatchCompute(uint32(windowWidth/16), uint32(windowHeight/16), 1)
		gl.MemoryBarrier(gl.SHADER_IMAGE_ACCESS_BARRIER_BIT)

		// Render the texture
		draw(renderProgram, texture)

		window.SwapBuffers()
	}
}

func initComputeShader() uint32 {
	shader, err := compileShader(computeShaderSource+"\x00", gl.COMPUTE_SHADER)
	if err != nil {
		log.Fatalln(err)
	}

	program := gl.CreateProgram()
	gl.AttachShader(program, shader)
	gl.LinkProgram(program)

	var status int32
	gl.GetProgramiv(program, gl.LINK_STATUS, &status)
	if status == gl.FALSE {
		var logLength int32
		gl.GetProgramiv(program, gl.INFO_LOG_LENGTH, &logLength)

		logg := strings.Repeat("\x00", int(logLength+1))
		gl.GetProgramInfoLog(program, logLength, nil, gl.Str(logg))

		log.Fatalln("failed to link program:", logg)
	}

	gl.DeleteShader(shader)

	return program
}

func initRenderShader() uint32 {
	vertexShader, err := compileShader(vertexShaderSource+"\x00", gl.VERTEX_SHADER)
	if err != nil {
		log.Fatalln(err)
	}

	fragmentShader, err := compileShader(fragmentShaderSource+"\x00", gl.FRAGMENT_SHADER)
	if err != nil {
		log.Fatalln(err)
	}

	program := gl.CreateProgram()
	gl.AttachShader(program, vertexShader)
	gl.AttachShader(program, fragmentShader)
	gl.LinkProgram(program)

	var status int32
	gl.GetProgramiv(program, gl.LINK_STATUS, &status)
	if status == gl.FALSE {
		var logLength int32
		gl.GetProgramiv(program, gl.INFO_LOG_LENGTH, &logLength)

		logg := strings.Repeat("\x00", int(logLength+1))
		gl.GetProgramInfoLog(program, logLength, nil, gl.Str(logg))

		log.Fatalln("failed to link program:", logg)
	}

	gl.DeleteShader(vertexShader)
	gl.DeleteShader(fragmentShader)

	var VAO, VBO uint32
	vertices := []float32{
		-1.0, -1.0, 0.0, 0.0,
		1.0, -1.0, 1.0, 0.0,
		1.0, 1.0, 1.0, 1.0,
		-1.0, 1.0, 0.0, 1.0,
	}
	indices := []uint32{
		0, 1, 2,
		2, 3, 0,
	}

	gl.GenVertexArrays(1, &VAO)
	gl.GenBuffers(1, &VBO)
	var EBO uint32
	gl.GenBuffers(1, &EBO)

	gl.BindVertexArray(VAO)

	gl.BindBuffer(gl.ARRAY_BUFFER, VBO)
	gl.BufferData(gl.ARRAY_BUFFER, 4*len(vertices), gl.Ptr(vertices), gl.STATIC_DRAW)

	gl.BindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO)
	gl.BufferData(gl.ELEMENT_ARRAY_BUFFER, 4*len(indices), gl.Ptr(indices), gl.STATIC_DRAW)

	gl.VertexAttribPointer(0, 2, gl.FLOAT, false, 4*4, unsafe.Pointer(uintptr(0)))
	gl.EnableVertexAttribArray(0)

	gl.VertexAttribPointer(1, 2, gl.FLOAT, false, 4*4, unsafe.Pointer(uintptr(2*4)))
	gl.EnableVertexAttribArray(1)

	return program
}

func draw(program uint32, texture uint32) {
	gl.Clear(gl.COLOR_BUFFER_BIT)
	gl.UseProgram(program)

	gl.ActiveTexture(gl.TEXTURE0)
	gl.BindTexture(gl.TEXTURE_2D, texture)

	gl.DrawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, unsafe.Pointer(uintptr(0)))
}

func compileShader(source string, shaderType uint32) (uint32, error) {
	shader := gl.CreateShader(shaderType)

	csources, free := gl.Strs(source)
	gl.ShaderSource(shader, 1, csources, nil)
	free()
	gl.CompileShader(shader)

	var status int32
	gl.GetShaderiv(shader, gl.COMPILE_STATUS, &status)
	if status == gl.FALSE {
		var logLength int32
		gl.GetShaderiv(shader, gl.INFO_LOG_LENGTH, &logLength)

		logg := strings.Repeat("\x00", int(logLength+1))
		gl.GetShaderInfoLog(shader, logLength, nil, gl.Str(logg))

		return 0, fmt.Errorf("failed to compile %v: %v", source, logg)
	}

	return shader, nil
}

// TODO: Make a cleaner abstraction for live-average FPS.
// lastTime is required to calculated FPS.
var lastTime float64
var lastAvgFPS float64
var calCount int

// showFPS prints the FPS to the standard output.
// It should be called inside the window.ShouldClose loop.
func showFPS() {
	currentTime := glfw.GetTime()
	currentFPS := 1.0 / (currentTime - lastTime)
	lastTime = currentTime

	lastAvgFPS = (float64(calCount)*lastAvgFPS + currentFPS) / (float64(calCount) + 1)
	fmt.Printf("\rFPS: %v ###", math.Ceil(lastAvgFPS))

	calCount++
}
