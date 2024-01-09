package main

import (
	_ "embed"
	"math/rand"
	"runtime"
	"time"

	"github.com/go-gl/gl/v4.6-core/gl"
	"github.com/go-gl/glfw/v3.3/glfw"
	"github.com/shivanshkc/lightshow/pkg"
)

//go:embed shaders/compute.glsl
var computeShaderSource string

//go:embed shaders/vertex.glsl
var vertexShaderSource string

//go:embed shaders/fragment.glsl
var fragmentShaderSource string

const (
	aspectRatio = 16.0 / 9.0

	// Actual screen height and width.
	screenHeight = 720
	screenWidth  = aspectRatio * screenHeight

	// Super-sampled screen height and width for antialiasing.
	aaScreenHeight = screenHeight * 2
	aaScreenWidth  = screenWidth * 2
)

// randGen is the random number generator that will be used to seed every frame.
var randGen = rand.New(rand.NewSource(time.Now().Unix()))

func init() {
	// Make sure the OpenGL code runs on the main thread.
	runtime.LockOSThread()
}

func main() {
	// Create a window, as OpenGL requires a window context.
	window, err := pkg.CreateWindow("Lightshow", screenWidth, screenHeight)
	pkg.CheckErr(err, "error in pkg.CreateWindow call")
	// Clean up.
	defer glfw.Terminate()

	// Initiate OpenGL.
	err = gl.Init()
	pkg.CheckErr(err, "failed to initialize opengl")

	// Compile the compute shader.
	computeShader, err := pkg.CompileShader(computeShaderSource+"\x00", gl.COMPUTE_SHADER)
	pkg.CheckErr(err, "failed to compile compute shader")
	// Compile the vertex shader.
	vertexShader, err := pkg.CompileShader(vertexShaderSource+"\x00", gl.VERTEX_SHADER)
	pkg.CheckErr(err, "failed to compile vertex shader")
	// Compile the fragment shader.
	fragmentShader, err := pkg.CompileShader(fragmentShaderSource+"\x00", gl.FRAGMENT_SHADER)
	pkg.CheckErr(err, "failed to compile fragment shader")

	// Setup vertex information for the vertex shader.
	setupFullscreenQuad()

	// Create the compute program, which will do the actual ray-tracing.
	computeProgram, err := pkg.CreateProgram(computeShader)
	pkg.CheckErr(err, "failed to create the compute program")
	// Create the render program, which will render the result on screen.
	renderProgram, err := pkg.CreateProgram(vertexShader, fragmentShader)
	pkg.CheckErr(err, "failed to create the render program")

	// Create the texture that will be populated by the compute shader.
	texture := pkg.CreateImageTexture2D(aaScreenWidth, aaScreenHeight)

	// Obtain the location of the initial random seed uniform.
	gl.UseProgram(computeProgram)
	seedUniLocation := gl.GetUniformLocation(computeProgram, gl.Str("init_seed\x00"))

	// Render loop.
	for !window.ShouldClose() {
		// Show FPS.
		pkg.ShowFPS(glfw.GetTime())

		// Switch to the compute program and set up inputs.
		gl.UseProgram(computeProgram)
		gl.Uniform1f(seedUniLocation, randGen.Float32())
		// Run the compute shader.
		gl.DispatchCompute(uint32(aaScreenWidth/16), uint32(aaScreenHeight/16), 1)
		// Wait for compute to finish.
		gl.MemoryBarrier(gl.ALL_BARRIER_BITS)

		// Clear the buffers.
		gl.Clear(gl.COLOR_BUFFER_BIT)

		// Switch to the render program and set up the input texture.
		gl.UseProgram(renderProgram)
		gl.ActiveTexture(gl.TEXTURE0)
		gl.BindTexture(gl.TEXTURE_2D, texture)

		// Render to screen.
		gl.DrawElementsWithOffset(gl.TRIANGLES, 6, gl.UNSIGNED_INT, uintptr(0))
		// Clear the texture before iteration.
		// gl.ClearTexImage(texture, 0, gl.RGBA, gl.UNSIGNED_BYTE, gl.Ptr(nil))

		glfw.PollEvents()
		window.SwapBuffers()
	}
}

// setupFullscreenQuad setups the vertex information that is fed to the vertex shader to render a full-screen quad.
//
// I don't understand most of this function.
func setupFullscreenQuad() {
	var vao, vbo, ebo uint32

	vertices := []float32{
		-1.0, -1.0, 0.0, 0.0,
		+1.0, -1.0, 1.0, 0.0,
		+1.0, +1.0, 1.0, 1.0,
		-1.0, +1.0, 0.0, 1.0,
	}

	indices := []uint32{0, 1, 2, 2, 3, 0}

	gl.GenVertexArrays(1, &vao)
	gl.BindVertexArray(vao)

	gl.GenBuffers(1, &vbo)
	gl.BindBuffer(gl.ARRAY_BUFFER, vbo)
	gl.BufferData(gl.ARRAY_BUFFER, 4*len(vertices), gl.Ptr(vertices), gl.STATIC_DRAW)

	gl.GenBuffers(1, &ebo)
	gl.BindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo)
	gl.BufferData(gl.ELEMENT_ARRAY_BUFFER, 4*len(indices), gl.Ptr(indices), gl.STATIC_DRAW)

	gl.VertexAttribPointerWithOffset(0, 2, gl.FLOAT, false, 4*4, uintptr(0))
	gl.EnableVertexAttribArray(0)

	gl.VertexAttribPointerWithOffset(1, 2, gl.FLOAT, false, 4*4, uintptr(2*4))
	gl.EnableVertexAttribArray(1)
}
