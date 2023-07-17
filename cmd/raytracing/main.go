package main

import (
	"fmt"
	"os"
	"raytracing/pkg"
)

const (
	imageWidth  = 1920
	imageHeight = 1080
)

func main() {
	fmt.Printf("P3\n")
	fmt.Printf("%d %d\n", imageWidth, imageHeight)
	fmt.Printf("255\n")

	for j := imageHeight - 1; j >= 0; j-- {
		// Progress tracker.
		debugf("\rLines remaining: %d", j)

		for i := 0; i < imageWidth; i++ {
			colour := pkg.NewColour(float32(i)/(imageWidth-1),
				float32(j)/(imageHeight-1), 0.25)

			fmt.Println(colour.GetPPMRow())
		}
	}

	debugf("\nDone.\n")
}

// debugf can be used to print debugging info.
func debugf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, format, a...)
}
