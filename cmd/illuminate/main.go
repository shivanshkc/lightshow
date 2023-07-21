package main

import (
	"fmt"
	"illuminate/pkg/camera"
	"illuminate/pkg/renderer"
	"illuminate/pkg/scenes"
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
var world = shapes.NewGroup(scenes.GlassBall, scenes.Ground)

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

// func populateWorld() {
// 	for a := -11; a < 11; a++ {
// 		for b := -11; b < 11; b++ {
// 			chooseMat := utils.Random.Float()
// 			center := utils.NewVec3(
// 				float64(a)+0.9*utils.Random.Float(),
// 				0.2,
// 				float64(b)*0.9*utils.Random.Float(),
// 			)

// 			if center.Sub(utils.NewVec3(4, 0.2, 0)).Mag() <= 0.9 {
// 				continue
// 			}

// 			if chooseMat < 0.33 {
// 				sphereMat := mats.NewMatte(utils.Random.Vec3().ToColour())
// 				world = append(world, &shapes.Sphere{
// 					Center: center,
// 					Radius: 0.2,
// 					Mat:    sphereMat,
// 				})
// 			} else if chooseMat < 0.67 {
// 				sphereMat := mats.NewMetallic(
// 					utils.Random.Vec3().ToColour(),
// 					utils.Random.FloatBetween(0, 0.5),
// 				)
// 				world = append(world, &shapes.Sphere{
// 					Center: center,
// 					Radius: 0.2,
// 					Mat:    sphereMat,
// 				})
// 			} else {
// 				sphereMat := mats.NewGlass(1.5)
// 				world = append(world, &shapes.Sphere{
// 					Center: center,
// 					Radius: 0.2,
// 					Mat:    sphereMat,
// 				})
// 			}
// 		}
// 	}

// 	sphereMat1 := mats.NewGlass(1.5)
// 	world = append(world, &shapes.Sphere{
// 		Center: utils.NewVec3(0, 1, 0),
// 		Radius: 1.0,
// 		Mat:    sphereMat1,
// 	})

// 	sphereMat2 := mats.NewMatte(utils.NewColour(0.4, 0.2, 0.1))
// 	world = append(world, &shapes.Sphere{
// 		Center: utils.NewVec3(-4, 1, 0),
// 		Radius: 1.0,
// 		Mat:    sphereMat2,
// 	})

// 	sphereMat3 := mats.NewMetallic(utils.NewColour(0.7, 0.5, 0.3), 0)
// 	world = append(world, &shapes.Sphere{
// 		Center: utils.NewVec3(4, 1, 0),
// 		Radius: 1.0,
// 		Mat:    sphereMat3,
// 	})

// 	world = append(world, &shapes.Sphere{
// 		Center: utils.NewVec3(0, -100000, 0),
// 		Radius: 100000,
// 		Mat:    mats.NewMatte(utils.NewColour(0.5, 0.5, 0.5)),
// 	})
// }
