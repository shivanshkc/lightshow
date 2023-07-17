package pkg

import "fmt"

type Colour struct {
	R float32
	G float32
	B float32
}

func NewColour(r, g, b float32) *Colour {
	return &Colour{R: r, G: g, B: b}
}

func (c *Colour) GetPPMRow() string {
	return fmt.Sprintf("%d %d %d", int(255.999*c.R),
		int(255.999*c.G), int(255.999*c.B))
}
