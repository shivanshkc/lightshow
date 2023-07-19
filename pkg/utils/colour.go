package utils

// Colour is an RGB colour.
type Colour struct {
	R, G, B float64
}

// NewColour returns a new Colour instance.
func NewColour(r, g, b float64) *Colour {
	return &Colour{r, g, b}
}

// ToVec3 converts this Colour to a Vec3 type by mapping
// the r, g, b values to x, y, z values respectively.
func (c *Colour) ToVec3() *Vec3 {
	return NewVec3(c.R, c.G, c.B)
}
