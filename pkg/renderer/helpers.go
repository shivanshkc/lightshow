package renderer

import (
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"io"
	"math"
	"os"
	"path/filepath"
	"strings"

	"github.com/shivanshkc/lightshow/pkg/shapes"
)

// Type alias for shape.
type shape = shapes.Shape

// encodeImage encodes the given image into the outFile.
// It infers the format of the image using the file extension.
// If the file has an unknown or no extension, it defaults to PNG.
func encodeImage(img image.Image, outFile string) error {
	// Obtain the file extension to decide on the encoder.
	extension := filepath.Ext(outFile)

	// Create the directory. If it already exists, nothing will happen.
	if err := os.MkdirAll(filepath.Dir(outFile), os.ModePerm); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", filepath.Dir(outFile), err)
	}

	// Open the output image file.
	imageFile, err := os.OpenFile(outFile, os.O_CREATE|os.O_WRONLY, os.ModePerm)
	if err != nil {
		return fmt.Errorf("failed to open image file: %w", err)
	}

	// Close the file upon completion.
	defer func() { _ = imageFile.Close() }()

	switch extension {
	case ".jpeg", ".jpg":
		return encodeJPG(img, imageFile)
	case ".ppm":
		return encodePPM(img, imageFile)
	default:
		return encodePNG(img, imageFile)
	}
}

// encodePNG encodes the given image.Image instance as a PNG into the outFile.
func encodePNG(img image.Image, file io.Writer) error {
	// Encode the image data.
	if err := png.Encode(file, img); err != nil {
		return fmt.Errorf("failed to encode JPG: %w", err)
	}

	return nil
}

// encodeJPG encodes the given image.Image instance as a JPG into the outFile.
func encodeJPG(img image.Image, file io.Writer) error {
	// Encode the image data.
	if err := jpeg.Encode(file, img, &jpeg.Options{Quality: 100}); err != nil {
		return fmt.Errorf("failed to encode PNG: %w", err)
	}

	return nil
}

// encodePPM encodes the given image.Image instance as a PPM into the outFile.
func encodePPM(img image.Image, file io.Writer) error {
	// Get image dimensions for looping.
	bounds := img.Bounds()
	width, height := bounds.Max.X, bounds.Max.Y

	// Header of the PPM file.
	header := fmt.Sprintf("P3\n%d %d\n255\n", width, height)
	if _, err := file.Write([]byte(header)); err != nil {
		return fmt.Errorf("failed to encode PPM: error in file.Write call: %w", err)
	}

	// Loop over each pixel.
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			// Convert the pixel colour to RGBA.
			col, asserted := img.At(x, y).(color.RGBA)
			if !asserted {
				return fmt.Errorf("failed to encode PPM: image contains invalid pixel value")
			}

			// Write the PPM line.
			line := fmt.Sprintf("%d %d %d\n", col.R, col.G, col.B)
			if _, err := file.Write([]byte(line)); err != nil {
				return fmt.Errorf("failed to encode PPM: error in file.Write call: %w", err)
			}
		}
	}

	return nil
}

// progressBarFromChannel accepts a channel to show the progress bar.
func progressBarFromChannel(pixelDoneChan <-chan struct{}, size int) {
	var donePixelCount int
	var lastPercent float64

	// Looping over percentChan to show progress.
	for range pixelDoneChan {
		donePixelCount++
		currentPercent := float64(donePixelCount) * 100 / float64(size)
		// Show progress in increments of 1 only, and not for every pixel.
		// This helps with performance.
		if currentPercent-lastPercent < 1 {
			continue
		}

		progressBar(currentPercent)
		lastPercent = currentPercent
	}
}

// progressBar shows the given progress in a bar.
func progressBar(percent float64) {
	// A 100 characters log progress bar will be too much.
	// So, we'll use 50 character and adjust the percent value accordingly.
	progressBarWidth := 50.0
	adjustedProgress := math.Ceil(progressBarWidth * percent / 100.0)

	// Forming the bar. It would look something like: [========>        ]
	bars := "[" +
		strings.Repeat("=", int(adjustedProgress)) +
		">" +
		strings.Repeat(" ", int(progressBarWidth-adjustedProgress)) +
		"]"

	// Print with clear screen.
	fmt.Printf("\r%s %.0f%%", bars, percent)
}
