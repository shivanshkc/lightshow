package main

import (
	"fmt"
	"math"
	"os"
	"raytracing/pkg"
	"time"
)

const (
	aspectRatio = 16.0 / 9.0
	imageWidth  = 1280
	imageHeight = imageWidth / aspectRatio

	viewportHeight = 2.0
	viewportWidth  = aspectRatio * viewportHeight
	focalLength    = 1.0
)

var (
	origin     = pkg.NewVector(0, 0, 0)
	horizontal = pkg.NewVector(viewportWidth, 0, 0)
	vertical   = pkg.NewVector(0, viewportHeight, 0)

	hittableGroup = pkg.NewHittableGroup([]pkg.Hittable{
		&pkg.Sphere{Center: pkg.NewVector(0, 0, -1), Radius: 0.5},
		&pkg.Sphere{Center: pkg.NewVector(0, -100.5, -1), Radius: 100},
	})
)

func main() {
	start := time.Now()
	defer func() { debugf("\nDone. Time taken: %+v\n", time.Since(start)) }()

	lowerLeftCorner := origin.
		Minus(horizontal.Divide(2)).
		Minus(vertical.Divide(2)).
		Minus(pkg.NewVector(0, 0, focalLength))

	fmt.Printf("P3\n")
	fmt.Printf("%d %d\n", int(imageWidth), int(imageHeight))
	fmt.Printf("255\n")

	for j := imageHeight - 1; j >= 0; j-- {
		// Progress tracker.
		debugf("\rLines remaining: %d", int(j))

		for i := 0; i < imageWidth; i++ {
			x := float64(i) / (imageWidth - 1)
			y := float64(j) / (imageHeight - 1)

			rayDirection := lowerLeftCorner.
				Plus(horizontal.Multiply(x)).
				Plus(vertical.Multiply(y)).
				Direction()

			ray := pkg.NewRay(origin, rayDirection)
			fmt.Println(rayColour(ray, hittableGroup).GetPPMRow())
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
