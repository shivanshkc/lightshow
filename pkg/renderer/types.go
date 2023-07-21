package renderer

import (
	"github.com/shivanshkc/illuminate/pkg/shapes"
	"github.com/shivanshkc/illuminate/pkg/utils"
)

// Type alias for shape.
type shape = shapes.Shape

// pixel represents a rendered pixel.
type pixel struct {
	x, y float64
	col  *utils.Colour
}
