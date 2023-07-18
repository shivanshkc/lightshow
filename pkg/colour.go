package pkg

import (
	"fmt"
	"math"
)

type Colour struct {
	R float64
	G float64
	B float64
}

func NewColour(r, g, b float64) *Colour {
	return &Colour{R: r, G: g, B: b}
}

func NewColourFromVec3(vec *Vec3) *Colour {
	return &Colour{R: vec.X, G: vec.Y, B: vec.Z}
}

func (c *Colour) GetPPMRow(samplesPerPixel int) string {
	scale := 1.0 / float64(samplesPerPixel)
	r, g, b := math.Sqrt(c.R*scale), math.Sqrt(c.G*scale), math.Sqrt(c.B*scale)

	return fmt.Sprintf(
		"%d %d %d",
		int(256*clamp(r, 0, 0.9999)),
		int(256*clamp(g, 0, 0.9999)),
		int(256*clamp(b, 0, 0.9999)),
	)
}

func (c *Colour) LerpTo(end *Colour, factor float64) *Colour {
	oneMinusFactor := 1 - factor

	return &Colour{
		oneMinusFactor*c.R + factor*end.R,
		oneMinusFactor*c.G + factor*end.G,
		oneMinusFactor*c.B + factor*end.B,
	}
}

func clamp(value, min, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}
