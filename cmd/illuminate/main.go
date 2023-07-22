package main

import (
	"fmt"
	"time"

	"github.com/shivanshkc/illuminate/pkg/camera"
	"github.com/shivanshkc/illuminate/pkg/mats"
	"github.com/shivanshkc/illuminate/pkg/random"
	"github.com/shivanshkc/illuminate/pkg/renderer"
	"github.com/shivanshkc/illuminate/pkg/shapes"
	"github.com/shivanshkc/illuminate/pkg/utils"
)

// aspectRatio of the rendered image.
const (
	aspectRatio = 16.0 / 9.0
	imageHeight = 720
)

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
	ImageWidth:        imageHeight * aspectRatio,
	ImageHeight:       imageHeight,
	SkyColour:         utils.NewColour(0.5, 0.75, 1.0),
	MaxDiffusionDepth: 50,
	SamplesPerPixel:   50,
	MaxWorkers:        400,
	OutputFile:        "./dist/image.jpg",
}

// world is a ShapeGroup that holds all the shapes to be rendered.
var world = shapes.NewGroup(
	&shapes.Sphere{
		Center: utils.NewVec3(0, -100000, 0),
		Radius: 100000,
		Mat:    mats.NewMatte(utils.NewColour(0.5, 0.5, 0.5)),
	},
	&shapes.Sphere{
		Center: utils.NewVec3(0, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewGlass(1.5),
	},
	&shapes.Sphere{
		Center: utils.NewVec3(4, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewMetallic(random.Vec3().ToColour(), 0),
	},
	&shapes.Sphere{
		Center: utils.NewVec3(-4, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewMatte(random.Vec3().ToColour()),
	},
)

func main() {
	// Log execution time.
	start := time.Now()
	defer func() { fmt.Printf("\nTime taken: %+v\n", time.Since(start)) }()

	// Populate the world with random spheres.
	randomize()

	// Start rendering.
	if err := renderer.New(renderOptions).Render(world); err != nil {
		panic(fmt.Errorf("failed to render: %w", err))
	}
}

// randomize adds random spheres to the world.
func randomize() {}
