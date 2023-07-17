package main

import (
	"fmt"
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

	sphereCenter = pkg.NewVector(0, 0, -1)
	sphereRadius = 0.5
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
			fmt.Println(rayColour(ray).GetPPMRow())
		}
	}
}

func rayColour(r *pkg.Ray) *pkg.Colour {
	if distance, hit := r.DistanceToSphere(sphereCenter, sphereRadius); hit {
		sphereNormal := r.PointAt(distance).Minus(sphereCenter)
		return pkg.NewColour(
			getZeroToOne(sphereNormal.X),
			getZeroToOne(sphereNormal.Y),
			getZeroToOne(sphereNormal.Z),
		)
	}

	unitDirection := r.Direction.Direction()
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
