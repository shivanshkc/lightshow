package renderer

import (
	"fmt"
	"image"
	"image/png"
	"os"

	"github.com/shivanshkc/illuminate/pkg/shapes"
)

// Type alias for shape.
type shape = shapes.Shape

// encodePNG encodes the given image.Image instance as a png into the outFile.
func encodePNG(outFile string, img image.Image) error {
	// Open the output image file.
	imageFile, err := os.OpenFile(outFile, os.O_CREATE|os.O_WRONLY, os.ModePerm)
	if err != nil {
		return fmt.Errorf("failed to open image file: %w", err)
	}
	// Close the file upon completion.
	defer func() { _ = imageFile.Close() }()

	// Encode the image data.
	if err := png.Encode(imageFile, img); err != nil {
		return fmt.Errorf("failed to encode image: %w", err)
	}

	return nil
}
