package shapes

import (
	"math"

	"github.com/shivanshkc/lightshow/pkg/utils"
)

// AABB stands for Axis-aligned bounding box.
// For more info, visit:
// https://raytracing.github.io/books/RayTracingTheNextWeek.html#boundingvolumehierarchies/axis-alignedboundingboxes(aabbs)
type AABB struct {
	// Min and Max hold 6 numbers in total. Every number represents an equation for a plane.
	// Like x = c is an equation for a plane (c is a constant).
	// So, these 6 numbers form 6 planes to create a box.
	Min, Max utils.Vec3
}

// NewAABB returns a new AABB instance.
func NewAABB(min, max utils.Vec3) *AABB {
	return &AABB{Min: min, Max: max}
}

// Hit method for the AABB type does not care about the RayHit record. It only tells whether there was a hit or not.
// That's because AABB is not an actual object to be rendered, just a logical entity.
//
// It is intentional that it doesn't implement the Shape interface, because that would lead to nil *RayHit records.
//
// To understand the exact math of this method, visit-
// https://raytracing.github.io/books/RayTracingTheNextWeek.html#boundingvolumehierarchies/anoptimizedaabbhitmethod
func (a *AABB) Hit(ray *utils.Ray, minD, maxD float64) bool {
	// Declare all vars beforehand. This helps with performance.
	var invD, t0, t1, tMin, tMax float64

	// CHECK INTERSECTION WITH X-AXIS ==================================================================================
	invD = 1.0 / ray.Dir.D[0]
	t0 = (a.Min.D[0] - ray.Origin.D[0]) * invD
	t1 = (a.Max.D[0] - ray.Origin.D[0]) * invD

	if invD < 0 {
		t0, t1 = t1, t0
	}

	// Keep the intersection inside the given tolerances (minD, maxD).
	tMin, tMax = minD, maxD
	if t0 > minD {
		tMin = t0
	}
	if t1 < maxD {
		tMax = t1
	}

	// If intersections don't overlap, ray doesn't hit the box.
	if tMax <= tMin {
		return false
	}

	// CHECK INTERSECTION WITH Y-AXIS ==================================================================================
	invD = 1.0 / ray.Dir.D[1]
	t0 = (a.Min.D[1] - ray.Origin.D[1]) * invD
	t1 = (a.Max.D[1] - ray.Origin.D[1]) * invD

	if invD < 0 {
		t0, t1 = t1, t0
	}

	// Keep the intersection inside the given tolerances (minD, maxD).
	tMin, tMax = minD, maxD
	if t0 > minD {
		tMin = t0
	}
	if t1 < maxD {
		tMax = t1
	}

	// If intersections don't overlap, ray doesn't hit the box.
	if tMax <= tMin {
		return false
	}

	// CHECK INTERSECTION WITH Z-AXIS ==================================================================================
	invD = 1.0 / ray.Dir.D[2]
	t0 = (a.Min.D[2] - ray.Origin.D[2]) * invD
	t1 = (a.Max.D[2] - ray.Origin.D[2]) * invD

	if invD < 0 {
		t0, t1 = t1, t0
	}

	// Keep the intersection inside the given tolerances (minD, maxD).
	tMin, tMax = minD, maxD
	if t0 > minD {
		tMin = t0
	}
	if t1 < maxD {
		tMax = t1
	}

	// If intersections don't overlap, ray doesn't hit the box.
	if tMax <= tMin {
		return false
	}

	// Ray hits the box.
	return true
}

// BoundingBox of an AABB is itself.
func (a *AABB) BoundingBox() *AABB {
	return a
}

// BoundingBoxWith returns the bounding box that contains both this, and the given AABB.
func (a *AABB) BoundingBoxWith(other *AABB) *AABB {
	// The minimum bounds of both the boxes.
	min := utils.NewVec3(
		math.Min(a.Min.D[0], other.Min.D[0]),
		math.Min(a.Min.D[1], other.Min.D[1]),
		math.Min(a.Min.D[2], other.Min.D[2]),
	)

	// The maximum bounds of the both the boxes.
	max := utils.NewVec3(
		math.Max(a.Max.D[0], other.Max.D[0]),
		math.Max(a.Max.D[1], other.Max.D[1]),
		math.Max(a.Max.D[2], other.Max.D[2]),
	)

	// A box that contains both.
	return NewAABB(min, max)
}
