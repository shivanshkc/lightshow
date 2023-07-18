package hittable

import (
	"math"
	"raytracing/pkg"
	"raytracing/pkg/material"
)

type HitInfo struct {
	Point *pkg.Vec3

	DistanceFromRayOrigin float64

	Normal          *pkg.Vec3
	IsNormalOutward bool

	Mat material.Material
}

func (h *HitInfo) updateNormalFacing(ray *pkg.Ray) {
	h.IsNormalOutward = ray.Direction.Dot(h.Normal) < 0
	if !h.IsNormalOutward {
		h.Normal = h.Normal.Multiply(-1)
	}
}

type Hittable interface {
	IsHit(ray *pkg.Ray, tMin, tMax float64) (*HitInfo, bool)
}

type Sphere struct {
	Center *pkg.Vec3
	Radius float64
	Mat    material.Material
}

func (s *Sphere) IsHit(ray *pkg.Ray, tMin, tMax float64) (*HitInfo, bool) {
	origin2Center := ray.Origin.Minus(s.Center)

	// Calculations as per the sphere equation.
	a := ray.Direction.Dot(ray.Direction)
	bHalf := origin2Center.Dot(ray.Direction)
	c := origin2Center.Dot(origin2Center) - s.Radius*s.Radius

	discriminant := bHalf*bHalf - a*c
	if discriminant < 0 {
		return nil, false
	}

	// Note that root1 is always smaller than root2 because
	// discriminant is positive.
	root1 := (-bHalf - math.Sqrt(discriminant)) / a
	root2 := (-bHalf + math.Sqrt(discriminant)) / a

	closerRoot := root1
	// If root1 is outside of bounds...
	if root1 < tMin || root1 > tMax {
		// If root2 is outside of bounds...
		if root2 < tMin || root2 > tMax {
			return nil, false
		}
		// Update the closer root.
		closerRoot = root2
	}

	// Create the hit information object.
	var hitInfo HitInfo
	hitInfo.Point = ray.PointAt(closerRoot)
	hitInfo.DistanceFromRayOrigin = closerRoot

	hitInfo.Normal = hitInfo.Point.Minus(s.Center).Direction()
	hitInfo.updateNormalFacing(ray)

	hitInfo.Mat = s.Mat

	return &hitInfo, true
}
