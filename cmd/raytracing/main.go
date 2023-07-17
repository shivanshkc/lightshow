package main

import (
	"fmt"
	"os"
	"raytracing/pkg"
)

const (
	aspectRatio = 16.0 / 9.0
	imageWidth  = 1024.0
	imageHeight = imageWidth / aspectRatio

	viewportHeight = 2.0
	viewportWidth  = aspectRatio * viewportHeight
	focalLength    = 1.0
)

var (
	origin     = pkg.NewVector(0, 0, 0)
	horizontal = pkg.NewVector(viewportWidth, 0, 0)
	vertical   = pkg.NewVector(0, viewportHeight, 0)
)

func main() {
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
				Plus(vertical.Multiply(y))

			ray := pkg.NewRay(origin, rayDirection)
			fmt.Println(blueGradientColour(ray).GetPPMRow())
		}
	}

	debugf("\nDone.\n")
}

func blueGradientColour(r *pkg.Ray) *pkg.Colour {
	unitDirection := r.Direction.Direction()
	t := 0.5 * (unitDirection.Y + 1)
	return pkg.NewColour(1, 1, 1).LerpTo(pkg.NewColour(0.5, 0.7, 1.0), t)
}

// debugf can be used to print debugging info.
func debugf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, format, a...)
}
