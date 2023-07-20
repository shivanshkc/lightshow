package main

import (
	"fmt"
	"os"
	"raytracing/pkg/camera"
	"raytracing/pkg/renderer"
	"raytracing/pkg/shapes"
	"raytracing/pkg/utils"
	"time"
)

// aspectRatio of the rendered image.
var aspectRatio = 16.0 / 9.0

// cameraOptions holds all the camera configs.
var cameraOptions = &camera.Options{
	LookFrom:            utils.NewVec3(13, 2, 3),
	LookAt:              utils.NewVec3(0, 0, 0),
	Up:                  utils.NewVec3(0, 1, 0),
	AspectRatio:         aspectRatio,
	FieldOfViewVertical: 20,
	Aperture:            0.1,
	FocusDistance:       10,
}

// renderOptions holds all the renderer configs.
var renderOptions = &renderer.Options{
	Camera:            camera.New(cameraOptions),
	ImageWidth:        1920,
	ImageHeight:       1920 / aspectRatio,
	SkyColour:         utils.NewColour(0.5, 0.75, 1.0),
	MaxDiffusionDepth: 50,
	SamplesPerPixel:   100,
	ProgressLogger:    func(s string) { debugf("\r%s", s) },
}

// world is a ShapeGroup that holds all the shapes to be rendered.
var world = shapes.NewGroup()

func main() {
	// Log execution time.
	start := time.Now()
	defer func() { debugf("\nDone. Time taken: %+v\n", time.Since(start)) }()

	// Start rendering.
	renderer.New(renderOptions).Render(world)
}

// debugf can be used to print debugging info.
func debugf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, format, a...)
}