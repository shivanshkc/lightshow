package shapes

import (
	"github.com/shivanshkc/lightshow/pkg/mats"
	"github.com/shivanshkc/lightshow/pkg/utils"
)

// Group represents a group of shapes.
// It implements the Shape interface itself so it can be treated as a single Shape.
//
// Its implementation of the Shape interface returns the closest point-of-hit out of
// all the shapes for the given ray.
type Group struct {
	Shapes []Shape
}

// NewGroup creates a new Group instance.
func NewGroup(shapes ...Shape) *Group {
	return &Group{Shapes: shapes}
}

// Hit returns the closest point-of-hit out of all the shapes for the given ray.
func (g *Group) Hit(ray utils.Ray, minD, maxD float64) (*mats.RayHit, bool) {
	// hitAnything will be true if at least a single shape is hit.
	hitAnything := false
	// This will keep track of the closest point-of-hit so far.
	closestSoFar := maxD
	// This will keep the RayHit record for the closest hit.
	var closestRayHit *mats.RayHit

	// Loop over all shapes to determine the closest hit.
	for _, shape := range g.Shapes {
		// Notice the usage of "closestSoFar" here. It leads to lots of calculation savings.
		info, isHit := shape.Hit(ray, minD, closestSoFar)
		if !isHit {
			continue
		}

		hitAnything = true
		closestSoFar = info.Distance
		closestRayHit = info
	}

	return closestRayHit, hitAnything
}

func (g *Group) BoundingBox() *AABB {
	// If no shapes, panic.
	if len(g.Shapes) == 0 {
		panic("cannot generate the bounding box of an empty Group")
	}

	// Bounding box to start with.
	boundingBox := g.Shapes[0].BoundingBox()

	// Start loop from 1 as the first element is already dealt with.
	// This loop combines the bounding boxes of all shapes.
	for i := 1; i < len(g.Shapes); i++ {
		boundingBox = boundingBox.BoundingBoxWith(g.Shapes[i].BoundingBox())
	}

	return boundingBox
}
