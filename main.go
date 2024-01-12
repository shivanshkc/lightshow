package main

import (
	"math/rand"
	"runtime"
	"time"

	"github.com/go-gl/gl/v4.6-core/gl"
	"github.com/go-gl/glfw/v3.3/glfw"
	"github.com/shivanshkc/lightshow/pkg"
)

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
	// Read shaders.
	cShaderSource := pkg.ReadFiles(true,
		"shaders/comp-1-head.glsl",
		"shaders/comp-2-rand.glsl",
		"shaders/comp-3-util.glsl",
		"shaders/comp-4-cam.glsl",
		"shaders/comp-5-mat.glsl",
		"shaders/comp-6-shape-sphere.glsl",
		"shaders/comp.glsl",
	)

	vShaderSource := pkg.ReadFiles(false, "shaders/vert.glsl")
	fShaderSource := pkg.ReadFiles(false, "shaders/frag.glsl")

	// Create a window, as OpenGL requires a window context.
	window, err := pkg.CreateWindow("Lightshow", screenWidth, screenHeight)
	pkg.CheckErr(err, "error in pkg.CreateWindow call")
	// Clean up.
	defer glfw.Terminate()

	// Initiate OpenGL.
	err = gl.Init()
	pkg.CheckErr(err, "failed to initialize opengl")

	// Compile the compute shader.
	computeShader, err := pkg.CompileShader(cShaderSource+"\x00", gl.COMPUTE_SHADER)
	pkg.CheckErr(err, "failed to compile compute shader")
	// Compile the vertex shader.
	vertexShader, err := pkg.CompileShader(vShaderSource+"\x00", gl.VERTEX_SHADER)
	pkg.CheckErr(err, "failed to compile vertex shader")
	// Compile the fragment shader.
	fragmentShader, err := pkg.CompileShader(fShaderSource+"\x00", gl.FRAGMENT_SHADER)
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
	_ = pkg.CreateImageTexture2D(aaScreenWidth, aaScreenHeight)

	// Obtain the location of the initial random seed uniform.
	gl.UseProgram(computeProgram)
	seedUniLocation := gl.GetUniformLocation(computeProgram, gl.Str("init_seed\x00"))

	// Initial positions of the bodies.
	positions := []float32{
		0.12, 0.0, -1.4,
		-0.4, 0.0, -1.0,
		-0.4, 0.0, -1.0,
		0.0, -1000.5, -1.0,
	}

	// Create the positions buffer and bind it.
	var posBuf uint32
	gl.GenBuffers(1, &posBuf)
	gl.BindBuffer(gl.SHADER_STORAGE_BUFFER, posBuf)
	gl.BufferData(gl.SHADER_STORAGE_BUFFER, len(positions)*4, gl.Ptr(positions), gl.STATIC_DRAW)
	gl.BindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, posBuf)

	// Render loop.
	for !window.ShouldClose() {
		// Show FPS.
		pkg.ShowFPS(glfw.GetTime())

		// Update positions.
		// positions[4] = (float32(math.Sin(glfw.GetTime())) / 2) + 0.15
		// positions[7] = (float32(math.Sin(glfw.GetTime())) / 2) + 0.15
		positions[3], positions[5] = pkg.MoveOnCircle(float64(positions[0]), float64(positions[2]), glfw.GetTime()/2, 0.8)
		positions[6], positions[8] = positions[3], positions[5]
		// Set new positions.
		gl.BufferData(gl.SHADER_STORAGE_BUFFER, len(positions)*4, gl.Ptr(positions), gl.STATIC_DRAW)

		// Switch to the compute program and set up inputs.
		gl.UseProgram(computeProgram)
		gl.Uniform1f(seedUniLocation, randGen.Float32())
		// Run the compute shader.
		gl.DispatchCompute(uint32(aaScreenWidth/16), uint32(aaScreenHeight/16), 1)
		// Wait for compute to finish.
		gl.MemoryBarrier(gl.ALL_BARRIER_BITS)

		// This line is recommended doesn't seem to do anything.
		// gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		// Switch to the render program.
		gl.UseProgram(renderProgram)
		// Render to screen.
		gl.DrawElementsWithOffset(gl.TRIANGLES, 6, gl.UNSIGNED_INT, uintptr(0))

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
