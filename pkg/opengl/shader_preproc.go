package opengl

import (
	"fmt"
	"os"
	"strings"
)

const (
	// shDirectiveImport is the preprocess directive for importing shader files.
	shDirectiveImport = "//lightshow:import"
)

// Preprocess the directives in the shader.
func (s *Shader) Preprocess() (err error) {
	// Loop over each line to process it.
	for _, line := range strings.Split(s.source, "\n") {
		// Get the directive to decide on the preprocessor.
		directive, line := getDirective(line)

		// Switch case for different preprocessors.
		switch directive {
		// Import preprocessor.
		case shDirectiveImport:
			line, err = s.preprocessImport(line)
			if err != nil {
				return fmt.Errorf("error in the preprocessImport call: %w", err)
			}
			// Add the processed line to the pSource.
			s.pSource += line
		// No preprocessing.
		default:
			// Add the same line to the pSource.
			s.pSource += line + " \n"
		}
	}

	// Log it the preprocessed source for debugging.
	_ = os.WriteFile("shader.log", []byte(s.pSource), os.ModePerm)
	return nil
}

// preprocessImport assumes the line to be of the format: "<import-directive> <filepath>"
// It replaces the directive with the file contents.
func (s *Shader) preprocessImport(line string) (string, error) {
	// Remove the directive prefix.
	filePath := strings.TrimPrefix(line, shDirectiveImport)

	// Trim tabs and spaces.
	filePath = strings.Trim(filePath, " ")
	filePath = strings.Trim(filePath, "\t")

	// Open the file to be imported.
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("error in the os.ReadFile call: %w", err)
	}

	// Replace the line with the content.
	return "\n" + string(content) + "\n", nil
}

// getDirective returns the preprocessing directive used in the line.
//
// The second return parameter is the cleaned up line string.
func getDirective(line string) (string, string) {
	// Trim spaces and tabs.
	line = strings.Trim(line, " ")
	line = strings.Trim(line, "\t")

	// If doesn't start with recognized directive, return empty.
	if !strings.HasPrefix(line, "//lightshow:") && !strings.HasPrefix(line, "// lightshow:") {
		return "", line
	}

	//	Replace slash-slash-space with slash-slash for simplicity.
	if strings.HasPrefix(line, "// ") {
		line = strings.Replace(line, "// ", "//", 1)
	}

	// Return the complete directive name.
	return strings.Split(line, " ")[0], line
}
