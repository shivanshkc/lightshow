package mats

import (
	"github.com/shivanshkc/lightshow/pkg/utils"
)

// Material for a shape. It allows for different ray scattering behaviours.
// For example: shiny, translucent, matte etc.
type Material interface {
	// Scatter attempts to scatter the inbound ray using the info present in
	// the RayHit instance.
	//
	// The return values include the scattered ray, the attenuation of the
	// material and a flag that tells whether the ray was scattered at all.
	// If a ray is not scattered, the material at that point should appear black.
	Scatter(ray utils.Ray, hitInfo *RayHit,
	) (scattered utils.Ray, attenuation utils.Colour, isScattered bool)
}

// RayHit encapsulates the information regarding a ray hit.
// TODO: Is this the correct package for this struct?
type RayHit struct {
	// Point is the position vector of the point-of-hit.
	Point utils.Vec3
	// Distance of the point-of-hit from the ray origin.
	Distance float64

	// Normal vector to the surface at the point-of-hit.
	Normal utils.Vec3
	// IsRayOutside tells whether the ray hit occurs inside or outside the shape.
	// This is calculated using the dot product of the ray direction and the normal.
	// For more details, visit-
	//nolint:lll
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#surfacenormalsandmultipleobjects/frontfacesversusbackfaces
	IsRayOutside bool

	// Mat is the material of the shape.
	Mat Material
}
