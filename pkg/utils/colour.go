package utils

import (
	"fmt"
	"image/color"
)

// Colour is an RGB colour.
type Colour struct {
	R, G, B float64
}

// NewColour returns a new Colour instance.
func NewColour(r, g, b float64) *Colour {
	return &Colour{r, g, b}
}

// Add adds the given colour to the colour and returns the result.
func (c *Colour) Add(arg *Colour) *Colour {
	return NewColour(c.R+arg.R, c.G+arg.G, c.B+arg.B)
}

// Lerp stands for Linear Interpolation.
//
// It is mainly used for blending two colours smoothly.
//
// The formula for linear interpolation is given by:
// final = (1 - x) * start + x * end.
func (c *Colour) Lerp(end *Colour, x float64) *Colour {
	// TODO: Is this extensive chaining a performance concern?
	return c.ToVec3().Lerp(end.ToVec3(), x).ToColour()
}

// ToVec3 converts this Colour to a Vec3 type by mapping
// the r, g, b values to x, y, z values respectively.
func (c *Colour) ToVec3() *Vec3 {
	return NewVec3(c.R, c.G, c.B)
}

// ToStd provides the standard library colour instance for this colour.
func (c *Colour) ToStd() color.Color {
	return color.RGBA{
		uint8(256 * clamp(c.R, 0, 0.9999)),
		uint8(256 * clamp(c.G, 0, 0.9999)),
		uint8(256 * clamp(c.B, 0, 0.9999)),
		255,
	}
}

// ToPPM converts the colour to a row of the PPM image format.
// The format of the row is nothing but "<0-255> <0-255> <0-255>".
func (c *Colour) ToPPM() string {
	return fmt.Sprintf(
		"%d %d %d",
		int(256*clamp(c.R, 0, 0.9999)),
		int(256*clamp(c.G, 0, 0.9999)),
		int(256*clamp(c.B, 0, 0.9999)),
	)
}

// clamp the given value between min and max.
//
//nolint:unparam
func clamp(value, min, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}
