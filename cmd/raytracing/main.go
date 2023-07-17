package main

import (
	"fmt"
	"math"
	"math/rand"
	"os"
	"raytracing/pkg"
	"time"
)

const (
	aspectRatio    = 16.0 / 9.0
	viewportHeight = 2.0
	focalLength    = 1.0

	imageWidth  = 1280
	imageHeight = imageWidth / aspectRatio

	// For anti-aliasing.
	samplesPerPixel = 100
)

var (
	camera = pkg.NewCamera(aspectRatio, viewportHeight, focalLength)

	hittableGroup = pkg.NewHittableGroup([]pkg.Hittable{
		&pkg.Sphere{Center: pkg.NewVector(0, 0, -1), Radius: 0.5},
		&pkg.Sphere{Center: pkg.NewVector(0, -100.5, -1), Radius: 100},
	})
)

func main() {
	start := time.Now()
	defer func() { debugf("\nDone. Time taken: %+v\n", time.Since(start)) }()

	fmt.Printf("P3\n")
	fmt.Printf("%d %d\n", int(imageWidth), int(imageHeight))
	fmt.Printf("255\n")

	// Create a random number generator.
	var randSeed int64 = int64(time.Now().Nanosecond())
	randomGen := rand.New(rand.NewSource(randSeed))

	for j := imageHeight - 1; j >= 0; j-- {
		// Progress tracker.
		debugf("\rLines remaining: %d", int(j))

		for i := 0.0; i < imageWidth; i++ {
			colour := pkg.NewColour(0, 0, 0)

			for s := 0; s < samplesPerPixel; s++ {
				x := (i + randomGen.Float64()) / (imageWidth - 1)
				y := (j + randomGen.Float64()) / (imageHeight - 1)

				rayCol := rayColour(camera.GetRay(x, y), hittableGroup)
				colour = pkg.NewColour(
					colour.R+rayCol.R,
					colour.G+rayCol.G,
					colour.B+rayCol.B,
				)
			}

			fmt.Println(colour.GetPPMRow(samplesPerPixel))
		}
	}
}

func rayColour(ray *pkg.Ray, hittable pkg.Hittable) *pkg.Colour {
	if record, isHit := hittable.IsHit(ray, 0, math.MaxFloat64); isHit {
		colourVec := record.Normal.Plus(pkg.NewVector(1, 1, 1)).Divide(2)
		return pkg.NewColourFromVec3(colourVec)
	}

	unitDirection := ray.Direction.Direction()
	// Here, unitDirection.Y varies from -1 to 1.
	zeroToOne := getZeroToOne(unitDirection.Y)
	return pkg.NewColour(1, 1, 1).LerpTo(pkg.NewColour(0.5, 0.7, 1.0), zeroToOne)
}

func getZeroToOne(minusOneToOne float64) float64 {
	return 0.5 * (minusOneToOne + 1)
}

// debugf can be used to print debugging info.
func debugf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, format, a...)
}
