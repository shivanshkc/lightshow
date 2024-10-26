package utils

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/go-gl/gl/v4.6-core/gl"
	"github.com/go-gl/glfw/v3.3/glfw"
)

// CreateWindow creates a GLFW window with the given title, width and height.
//
// Make sure to call glfw.Terminate when done with the window.
func CreateWindow(title string, width, height int) (*glfw.Window, error) {
	// Initiate GLFW.
	if err := glfw.Init(); err != nil {
		return nil, fmt.Errorf("error in glfw.Init call: %w", err)
	}

	// Set GLFW metadata, but what is it exactly?
	glfw.WindowHint(glfw.ContextVersionMajor, 4)
	glfw.WindowHint(glfw.ContextVersionMinor, 6)
	glfw.WindowHint(glfw.OpenGLProfile, glfw.OpenGLCoreProfile)
	glfw.WindowHint(glfw.OpenGLForwardCompatible, glfw.True)

	// Create the window.
	window, err := glfw.CreateWindow(width, height, title, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("error in glfw.CreateWindow call: %w", err)
	}

	// What?
	window.MakeContextCurrent()
	return window, nil
}

// CreateProgram creates and returns an OpenGL program with the given shaders attached.
//
// Note that the shaders are deleted after program creation.
func CreateProgram(shaders ...uint32) (uint32, error) {
	// Delete all shaders upon return.
	defer func() {
		for _, shader := range shaders {
			gl.DeleteShader(shader)
		}
	}()

	// Create program and attach all shaders.
	program := gl.CreateProgram()
	for _, shader := range shaders {
		gl.AttachShader(program, shader)
	}

	// Link the program.
	gl.LinkProgram(program)
	// Check program link status.
	var status int32
	gl.GetProgramiv(program, gl.LINK_STATUS, &status)
	if status == gl.FALSE {
		// Get log length to obtain the failure log.
		var logLength int32
		gl.GetProgramiv(program, gl.INFO_LOG_LENGTH, &logLength)
		// Get the failure log.
		fLog := strings.Repeat("\x00", int(logLength+1))
		gl.GetProgramInfoLog(program, logLength, nil, gl.Str(fLog))
		// Return the error with log.
		return 0, fmt.Errorf("failed to link program: %v", fLog)
	}

	// Success.
	return program, nil
}

// CreateImageTexture2D creates a 2D image texture with the given width and height.
func CreateImageTexture2D(width, height int32) uint32 {
	randGen := rand.New(rand.NewSource(time.Now().UnixNano()))

	pixels := make([]float32, width*height*4)
	for i := 0; i < int(width*height*4); i += 4 {
		color := float32(randGen.Intn(2)) // Randomly choose 0.0 or 1.0
		pixels[i] = color                 // R
		pixels[i+1] = color               // G
		pixels[i+2] = color               // B
		pixels[i+3] = 1.0                 // A
	}

	var texture uint32
	// Generate a texture.
	gl.GenTextures(1, &texture)
	// Bind the texture to the 2D target, whatever that means.
	// AFAIK, this line sets this texture as the target output for the shaders.
	gl.BindTexture(gl.TEXTURE_2D, texture)
	// Specify that it is an image texture that'll hold RGBA values.
	gl.TexImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, gl.Ptr(pixels))
	// Filter parameters. *shrugs*
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
	// *more shrugs*
	gl.BindImageTexture(0, texture, 0, false, 0, gl.READ_WRITE, gl.RGBA32F)

	return texture
}

// CheckErrGL panics if there's any error in the OpenGL operation.
// The error log mentions the given ID for easy debugging.
func CheckErrGL(id any) {
	if err := gl.GetError(); err != gl.NO_ERROR {
		panic(fmt.Errorf("[%v] error in opengl: %d", id, err))
	}
}
