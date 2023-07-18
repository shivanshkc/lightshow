package main

import (
	"fmt"
	"math"
	"os"
	"raytracing/pkg"
	"raytracing/pkg/hittable"
	"raytracing/pkg/material"
	"time"
)

const (
	aspectRatio    = 16.0 / 9.0
	viewportHeight = 2.0
	focalLength    = 1.0

	imageWidth  = 480
	imageHeight = imageWidth / aspectRatio

	// For anti-aliasing.
	samplesPerPixel = 100

	maxDiffusionDepth = 50
)

var (
	camera = pkg.NewCamera(aspectRatio, viewportHeight, focalLength)

	hittableGroup = hittable.NewHittableGroup([]hittable.Hittable{
		&hittable.Sphere{
			Center: pkg.NewVector(0, 0, -1),
			Radius: 0.5,
			Mat: &material.Dielectric{
				RefractiveIndex: 2,
			},
		},
		&hittable.Sphere{
			Center: pkg.NewVector(-1, 0, -1),
			Radius: -0.4,
			Mat: &material.Lambertian{
				Attenuation: pkg.NewColour(0.1, 0.2, 0.3),
			},
		},
		&hittable.Sphere{
			Center: pkg.NewVector(-0.5, -0.25, -0.5),
			Radius: 0.1,
			Mat: &material.Metal{
				Attenuation: pkg.NewColour(0.2, 0.4, 0.2),
				Fuzz:        0.2,
			},
		},
		&hittable.Sphere{
			Center: pkg.NewVector(1.5, 0, -1),
			Radius: 0.5,
			Mat: &material.Metal{
				Attenuation: pkg.NewColour(0.6, 0.4, 0.2),
				Fuzz:        0.6,
			},
		},
		&hittable.Sphere{
			Center: pkg.NewVector(0, -100.5, -1),
			Radius: 100,
			Mat: &material.Lambertian{
				Attenuation: pkg.NewColour(0.8, 0.8, 0),
			},
		},
	})
)

func main() {
	start := time.Now()
	defer func() { debugf("\nDone. Time taken: %+v\n", time.Since(start)) }()

	fmt.Printf("P3\n")
	fmt.Printf("%d %d\n", int(imageWidth), int(imageHeight))
	fmt.Printf("255\n")

	for j := imageHeight - 1; j >= 0; j-- {
		// Progress tracker.
		go debugf("\rLines remaining: %d	", int(j))

		for i := 0.0; i < imageWidth; i++ {
			colour := pkg.NewColour(0, 0, 0)

			for s := 0; s < samplesPerPixel; s++ {
				x := (i + pkg.RandomFloat()) / imageWidth
				y := (j + pkg.RandomFloat()) / imageHeight

				rayCol := rayColour(camera.GetRay(x, y), hittableGroup, maxDiffusionDepth)
				colour = pkg.NewColour(
					colour.R+rayCol.R,
					colour.G+rayCol.G,
					colour.B+rayCol.B,
				)
			}

			go fmt.Println(colour.GetPPMRow(samplesPerPixel))
		}
	}
}

func rayColour(ray *pkg.Ray, hittable hittable.Hittable, depth int) *pkg.Colour {
	if depth < 1 {
		return pkg.NewColour(0, 0, 0)
	}

	if record, isHit := hittable.IsHit(ray, 0.001, math.MaxFloat64); isHit {
		scattered, attenuation, isScattered :=
			record.Mat.Scatter(ray, record.Point, record.Normal, record.IsNormalOutward)
		if !isScattered {
			return pkg.NewColour(0, 0, 0)
		}

		scatteredRayCol := rayColour(scattered, hittable, depth-1)
		return pkg.NewColour(
			scatteredRayCol.R*attenuation.R,
			scatteredRayCol.G*attenuation.G,
			scatteredRayCol.B*attenuation.B,
		)
	}

	unitDirection := ray.Direction.Direction()
	// Here, unitDirection.Y varies from -1 to 1.
	zeroToOne := 0.5 * (unitDirection.Y + 1)
	return pkg.NewColour(1, 1, 1).LerpTo(pkg.NewColour(0.5, 0.75, 1.0), zeroToOne)
}

// debugf can be used to print debugging info.
func debugf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, format, a...)
}
