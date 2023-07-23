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
// TODO: See if the optimisation described in the link below increases the performance of this method.
// https://raytracing.github.io/books/RayTracingTheNextWeek.html#boundingvolumehierarchies/anoptimizedaabbhitmethod
func (a *AABB) Hit(ray *utils.Ray, minD, maxD float64) bool {
	// Convert vectors to arrays for easy operation.
	aMin, aMax, rOrg, rDir := a.Min.ToArr(), a.Max.ToArr(), ray.Origin.ToArr(), ray.Dir.ToArr()

	for i := 0; i < 3; i++ {
		// Calculate intersection points.
		q1 := (aMin[i] - rOrg[i]) / rDir[i]
		q2 := (aMax[i] - rOrg[i]) / rDir[i]

		// Get closest and farthest intersections.
		t0 := math.Min(q1, q2)
		t1 := math.Max(q1, q2)

		// Keep the intersection inside the given tolerances (minD, maxD).
		tMin := math.Max(t0, minD)
		tMax := math.Min(t1, maxD)

		// If intersections don't overlap, ray doesn't hit the box.
		if tMax <= tMin {
			return false
		}
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
