package main

import (
	"fmt"
	"illuminate/pkg/camera"
	"illuminate/pkg/mats"
	"illuminate/pkg/renderer"
	"illuminate/pkg/shapes"
	"illuminate/pkg/utils"
	"os"
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
	ImageWidth:        800,
	ImageHeight:       800 / aspectRatio,
	SkyColour:         utils.NewColour(0.5, 0.75, 1.0),
	MaxDiffusionDepth: 50,
	SamplesPerPixel:   25,
	ProgressLogger:    func(s string) { debugf("\r%s.", s) },
}

// world is a ShapeGroup that holds all the shapes to be rendered.
var world = shapes.NewGroup(
	&shapes.Sphere{
		Center: utils.NewVec3(0, -100000, 0),
		Radius: 100000,
		Mat:    mats.NewMatte(utils.NewColour(0.5, 0.5, 5)),
	},
	&shapes.Sphere{
		Center: utils.NewVec3(0, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewGlass(1.5),
	},
)

func main() {
	// Log execution time.
	start := time.Now()
	defer func() { debugf("\nDone. Time taken: %+v\n", time.Since(start)) }()

	// populateWorld()
	// Start rendering.
	renderer.New(renderOptions).Render(world)
}

// debugf can be used to print debugging info.
func debugf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, format, a...)
}
