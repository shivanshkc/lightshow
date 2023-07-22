package shapes

import (
	"github.com/shivanshkc/lightshow/pkg/mats"
	"github.com/shivanshkc/lightshow/pkg/utils"
)

// Shape represents any shape that can be hit by a ray.
type Shape interface {
	// Hit attempts to hit the shape with the given ray. In other words, it
	// checks if the surface of the shape intersects with the trajectory of the ray.
	//
	// The shape is considered hit (or intersected) if the point-of-hit lies
	// within the given distance range (see the "minD" and "maxD" arguments).
	//
	// If the shape is hit, the "isHit" flag is true and "info" contains the hit info.
	// Otherwise, "isHit" is false and "info" is nil.
	//
	// If the point of hit is closer (to the ray origin) than the minimum distance
	// value or farther than the maximum distance value, the shape will not
	// be visible.
	//
	// In most cases, the minD argument will be zero.
	Hit(ray *utils.Ray, minD, maxD float64) (info *mats.RayHit, isHit bool)
}
