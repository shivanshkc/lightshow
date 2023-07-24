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
	Min, Max *utils.Vec3
}

// NewAABB returns a new AABB instance.
func NewAABB(min, max *utils.Vec3) *AABB {
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
	invD = 1.0 / ray.Dir.X
	t0 = (a.Min.X - ray.Origin.X) * invD
	t1 = (a.Max.X - ray.Origin.X) * invD

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
	invD = 1.0 / ray.Dir.Y
	t0 = (a.Min.Y - ray.Origin.Y) * invD
	t1 = (a.Max.Y - ray.Origin.Y) * invD

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
	invD = 1.0 / ray.Dir.Z
	t0 = (a.Min.Z - ray.Origin.Z) * invD
	t1 = (a.Max.Z - ray.Origin.Z) * invD

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
		math.Min(a.Min.X, other.Min.X),
		math.Min(a.Min.Y, other.Min.Y),
		math.Min(a.Min.Z, other.Min.Z),
	)

	// The maximum bounds of the both the boxes.
	max := utils.NewVec3(
		math.Max(a.Max.X, other.Max.X),
		math.Max(a.Max.Y, other.Max.Y),
		math.Max(a.Max.Z, other.Max.Z),
	)

	// A box that contains both.
	return NewAABB(min, max)
}
