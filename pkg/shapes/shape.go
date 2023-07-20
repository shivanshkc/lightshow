package shapes

import (
	"raytracing/pkg/utils"
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
	Hit(ray *utils.Ray, minD, maxD float64) (info *RayHitInfo, isHit bool)
}

// RayHitInfo encapsulates the information regarding a ray hit.
type RayHitInfo struct {
	// Point is the position vector of the point-of-hit.
	Point *utils.Vec3
	// Distance of the point-of-hit from the ray origin.
	Distance float64

	// Normal vector to the surface at the point-of-hit.
	Normal *utils.Vec3
	// IsRayOutside tells whether the ray hit occurs inside or outside the shape.
	// This is calculated using the dot product of the ray direction and the normal.
	// For more details, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#surfacenormalsandmultipleobjects/frontfacesversusbackfaces
	IsRayOutside bool

	// Mat is the material of the shape.
	Mat interface{}
}
