package utils

import (
	"fmt"
)

// Colour is an RGB colour.
type Colour struct {
	R, G, B float64
}

// NewColour returns a new Colour instance.
func NewColour(r, g, b float64) *Colour {
	return &Colour{r, g, b}
}

// Lerp stands for Linear Interpolation.
//
// It is mainly used for blending two colours smoothly.
//
// The formula for linear interpolation is given by:
// final = (1 - x) * start + x * end
func (c *Colour) Lerp(end *Colour, x float64) *Colour {
	return c.ToVec3().Lerp(end.ToVec3(), x).ToColour()
}

// ToVec3 converts this Colour to a Vec3 type by mapping
// the r, g, b values to x, y, z values respectively.
func (c *Colour) ToVec3() *Vec3 {
	return NewVec3(c.R, c.G, c.B)
}

// ToPPM converts the colour to a row of the PPM image format.
// The format of the row is nothing but "<0-255> <0-255> <0-255>"
func (c *Colour) ToPPM() string {
	return fmt.Sprintf(
		"%d %d %d",
		int(255*clamp(c.R, 0, 0.9999)),
		int(255*clamp(c.G, 0, 0.9999)),
		int(255*clamp(c.B, 0, 0.9999)),
	)
}

// clamp the given value between min and max.
func clamp(value, min, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}
