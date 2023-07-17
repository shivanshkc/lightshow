package main

import (
	"fmt"
	"os"
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
			r, g, b := float32(i)/(imageWidth-1),
				float32(j)/(imageHeight-1), 0.25

			rInt, gInt, bInt := int(255.999*r),
				int(255.999*g), int(255.999*b)

			fmt.Printf("%d %d %d\n", rInt, gInt, bInt)
		}
	}

	debugf("\nDone.\n")
}

// debugf can be used to print debugging info.
func debugf(format string, a ...any) {
	fmt.Fprintf(os.Stderr, format, a...)
}
