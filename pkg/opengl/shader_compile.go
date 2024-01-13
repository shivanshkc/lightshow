package opengl

import (
	"fmt"
	"strings"

	"github.com/go-gl/gl/v4.6-core/gl"
)

// compile the given shader source.
// The shaderType must be one of gl.COMPUTE_SHADER, gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
//
// It returns a reference to the compiled shader and an error if any.
func (s *Shader) compile() error {
	// Get a reference to the shader.
	shaderID := gl.CreateShader(s.shaderType)

	// Fix the end of file character error.
	if !strings.HasSuffix(s.pSource, "\x00") {
		s.pSource += "\x00"
	}

	// Convert the shader source to a C-type string.
	cSource, free := gl.Strs(s.pSource)
	// Set the source to the shader reference.
	gl.ShaderSource(shaderID, 1, cSource, nil)
	// Free the memory of the C-type string.
	free()
	// Attempt shader compilation.
	gl.CompileShader(shaderID)

	var status int32
	// Check compilation status.
	gl.GetShaderiv(shaderID, gl.COMPILE_STATUS, &status)
	if status == gl.FALSE {
		// Get log length to obtain the failure log.
		var logLength int32
		gl.GetShaderiv(shaderID, gl.INFO_LOG_LENGTH, &logLength)
		// Get the failure log.
		fLog := strings.Repeat("\x00", int(logLength+1))
		gl.GetShaderInfoLog(shaderID, logLength, nil, gl.Str(fLog))
		// Return the error with log.
		return fmt.Errorf("failed to compile: %v", fLog)
	}

	// Success.
	s.glID = shaderID
	return nil
}
