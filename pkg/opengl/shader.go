package opengl

import (
	"fmt"
	"os"

	"github.com/go-gl/gl/v4.6-core/gl"
)

// Shader represents an OpenGL shader.
type Shader struct {
	// source is the raw source of the shader.
	source string
	// shaderType is one of gl.COMPUTE_SHADER, gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
	shaderType uint32
	// pSource is the preprocessed source of the shader.
	pSource string
	// glID is the reference to the compiled shader.
	glID uint32
}

// NewShader returns a new Shader instance.
//
// The shaderType must be one of gl.COMPUTE_SHADER, gl.VERTEX_SHADER or gl.FRAGMENT_SHADER.
func NewShader(path string, shaderType uint32) (*Shader, error) {
	// Validate shader type.
	if shaderType != gl.COMPUTE_SHADER && shaderType != gl.VERTEX_SHADER && shaderType != gl.FRAGMENT_SHADER {
		return nil, fmt.Errorf("invalid shader type provided: %v", shaderType)
	}

	// Read the shader source.
	source, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("error in os.ReadFile call: %w", err)
	}

	// Create and preprocess shader.
	shader := &Shader{source: string(source), shaderType: shaderType}
	if err := shader.Preprocess(); err != nil {
		return nil, fmt.Errorf("error in shader.Preprocess call: %w", err)
	}

	// Compile the shader.
	if err := shader.compile(); err != nil {
		return nil, fmt.Errorf("error in shader.compile call: %w", err)
	}

	return shader, nil
}

// ID returns the OpenGL reference of the shader.
func (s *Shader) ID() uint32 {
	return s.glID
}
