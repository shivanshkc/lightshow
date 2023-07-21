package renderer

import (
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"

	"github.com/shivanshkc/illuminate/pkg/shapes"
)

// Type alias for shape.
type shape = shapes.Shape

// encodePNG encodes the given image.Image instance as a PNG into the outFile.
func encodePNG(img image.Image, outFile string) error {
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

// encodePPM encodes the given image.Image instance as a PPM into the outFile.
func encodePPM(img image.Image, outFile string) error {
	// Get image dimensions for looping.
	bounds := img.Bounds()
	width, height := bounds.Max.X, bounds.Max.Y

	// Open the output image file.
	imageFile, err := os.OpenFile(outFile, os.O_CREATE|os.O_WRONLY, os.ModePerm)
	if err != nil {
		return fmt.Errorf("failed to open image file: %w", err)
	}
	// Close the file upon completion.
	defer func() { _ = imageFile.Close() }()

	// Header of the PPM file.
	header := fmt.Sprintf("P3\n%d %d\n255\n", width, height)
	imageFile.Write([]byte(header))

	// Loop over each pixel.
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			col := img.At(x, y).(color.RGBA)
			line := fmt.Sprintf("%d %d %d\n", col.R, col.G, col.B)
			imageFile.Write([]byte(line))
		}
	}

	return nil
}
