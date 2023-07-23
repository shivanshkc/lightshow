package main

import (
	"errors"
	"fmt"
	"net/http"
	"runtime"
	"time"

	"github.com/shivanshkc/lightshow/pkg/camera"
	"github.com/shivanshkc/lightshow/pkg/mats"
	"github.com/shivanshkc/lightshow/pkg/random"
	"github.com/shivanshkc/lightshow/pkg/renderer"
	"github.com/shivanshkc/lightshow/pkg/shapes"
	"github.com/shivanshkc/lightshow/pkg/utils"

	_ "net/http/pprof" //nolint:gosec // It's not an HTTP application.
)

const (
	// aspectRatio of the rendered image.
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
	// Ground.
	&shapes.Sphere{
		Center: utils.NewVec3(0, -100000, 0),
		Radius: 100000,
		Mat:    mats.NewMatte(utils.NewColour(0.5, 0.5, 1)),
	},
	// Middle glass sphere.
	&shapes.Sphere{
		Center: utils.NewVec3(0, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewGlass(1.5),
	},
	// Front metallic sphere.
	&shapes.Sphere{
		Center: utils.NewVec3(4, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewMetallic(utils.NewColour(0.7, 0.6, 0.5), 0),
	},
	// Back matte sphere.
	&shapes.Sphere{
		Center: utils.NewVec3(-4, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewMatte(utils.NewColour(0.4, 0.2, 0.1)),
	},
)

func main() {
	// Profiling.
	go pprof()
	// Populate the world with random spheres.
	randomize()

	// Log execution time.
	start := time.Now()
	defer func() { fmt.Printf("Time taken: %+v\n", time.Since(start)) }()

	fmt.Println("Rendering...")
	defer fmt.Println("Done.")

	// Start rendering.
	if err := renderer.New(renderOptions).Render(world); err != nil {
		panic(fmt.Errorf("failed to render: %w", err))
	}
}

// pprof enables profiling and sets up an HTTP server for pprof endpoints.
func pprof() {
	// Enable block profiling.
	runtime.SetBlockProfileRate(1)
	// Enable mutex profiling.
	runtime.SetMutexProfileFraction(1)

	//nolint:gosec // No need for timeouts.
	if err := http.ListenAndServe(":6060", nil); errors.Is(err, http.ErrServerClosed) {
		panic(fmt.Errorf("error in ListenAndServe for pprof: %w", err))
	}
}

// randomize adds random spheres to the world for a cool render.
//
// It is configured to work best with the default camera options.
func randomize() {
	fmt.Println("Spawning...")
	defer fmt.Println("Done.")

outer:
	// Loop to spawn spheres.
	for i := 0; i < 500; {
		// Properties of the sphere to be spawned.
		radius := 0.2
		center := utils.NewVec3(
			random.FloatBetween(-11, 11), radius,
			random.FloatBetween(-11, 11))

		// Make sure the generated sphere doesn't intersect with existing ones.
		for _, shape := range world.Shapes {
			// If the shape is not a sphere, we continue.
			sphere, ok := shape.(*shapes.Sphere)
			if !ok {
				continue outer
			}

			// If the shape is intersecting, we continue.
			if sphere.Center.Sub(center).Mag() < sphere.Radius+radius {
				continue outer
			}
		}

		// Choose a material randomly.
		matChooser := random.Float()
		var mat mats.Material

		//nolint:gocritic // Switch statement not possible.
		if matChooser < 0.667 {
			mat = mats.NewMatte(random.Vec3().ToColour())
		} else if matChooser < 0.9 {
			mat = mats.NewMetallic(random.Vec3().ToColour(), random.FloatBetween(0, 0.5))
		} else {
			mat = mats.NewGlass(1.5)
		}

		// Add to the world.
		world.Shapes = append(world.Shapes, shapes.NewSphere(center, radius, mat))
		i++
	}
}
