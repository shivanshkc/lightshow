package pkg

import "fmt"

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

func (c *Colour) GetPPMRow() string {
	return fmt.Sprintf("%d %d %d", int(255.999*c.R),
		int(255.999*c.G), int(255.999*c.B))
}

func (c *Colour) LerpTo(end *Colour, factor float64) *Colour {
	oneMinusFactor := 1 - factor

	return &Colour{
		oneMinusFactor*c.R + factor*end.R,
		oneMinusFactor*c.G + factor*end.G,
		oneMinusFactor*c.B + factor*end.B,
	}
}
