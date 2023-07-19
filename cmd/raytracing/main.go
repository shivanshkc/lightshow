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
	aspectRatio = 16.0 / 9.0

	imageWidth  = 1920
	imageHeight = imageWidth / aspectRatio

	maxDiffusionDepth = 50
	// For anti-aliasing.
	samplesPerPixel = 100
)

var hittables = []hittable.Hittable{
	// Ground.
	&hittable.Sphere{
		Center: pkg.NewVector(0, -100000, 0),
		Radius: 100000,
		Mat: &material.Lambertian{
			Attenuation: pkg.NewColour(0.5, 0.5, 5),
		},
	},
}

func main() {
	start := time.Now()
	defer func() { debugf("\nDone. Time taken: %+v\n", time.Since(start)) }()

	camera := createCamera()

	populateWorld()
	hittableGroup := hittable.NewHittableGroup(hittables)

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

func createCamera() *pkg.Camera {
	lookFrom, lookAt := pkg.NewVector(13, 2, 3), pkg.NewVector(0, 0, 0)

	return pkg.NewCamera(
		lookFrom, lookAt, pkg.NewVector(0, 1, 0),
		20.0, aspectRatio,
		0.1, 10,
	)
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

func populateWorld() {
	for a := -11; a < 11; a++ {
		for b := -11; b < 11; b++ {
			chooseMat := pkg.RandomFloat()
			center := pkg.NewVector(
				float64(a)+0.9*pkg.RandomFloat(),
				0.2,
				float64(b)*0.9*pkg.RandomFloat(),
			)

			if center.Minus(pkg.NewVector(4, 0.2, 0)).Magnitude() <= 0.9 {
				continue
			}

			if chooseMat < 0.8 {
				sphereMat := material.Lambertian{Attenuation: pkg.RandomColor()}
				hittables = append(hittables, &hittable.Sphere{
					Center: center,
					Radius: 0.2,
					Mat:    &sphereMat,
				})
			} else if chooseMat < 0.95 {
				sphereMat := material.Metal{
					Attenuation: pkg.RandomColor(),
					Fuzz:        pkg.RandomFloatBetween(0, 0.5),
				}

				hittables = append(hittables, &hittable.Sphere{
					Center: center,
					Radius: 0.2,
					Mat:    &sphereMat,
				})
			} else {
				sphereMat := material.Dielectric{RefractiveIndex: 1.5}
				hittables = append(hittables, &hittable.Sphere{
					Center: center,
					Radius: 0.2,
					Mat:    &sphereMat,
				})
			}
		}
	}

	sphereMat1 := material.Dielectric{RefractiveIndex: 1.5}
	hittables = append(hittables, &hittable.Sphere{
		Center: pkg.NewVector(0, 1, 0),
		Radius: 1.0,
		Mat:    &sphereMat1,
	})

	sphereMat2 := material.Lambertian{Attenuation: pkg.NewColour(0.4, 0.2, 0.1)}
	hittables = append(hittables, &hittable.Sphere{
		Center: pkg.NewVector(-4, 1, 0),
		Radius: 1.0,
		Mat:    &sphereMat2,
	})

	sphereMat3 := material.Metal{Attenuation: pkg.NewColour(0.7, 0.6, 0.5), Fuzz: 0}
	hittables = append(hittables, &hittable.Sphere{
		Center: pkg.NewVector(4, 1, 0),
		Radius: 1.0,
		Mat:    &sphereMat3,
	})
}
