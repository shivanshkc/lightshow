package pkg

import (
	"math"
)

type Ray struct {
	Origin    *Vec3
	Direction *Vec3
}

func NewRay(origin *Vec3, direction *Vec3) *Ray {
	return &Ray{Origin: origin, Direction: direction.Direction()}
}

func (r *Ray) PointAt(distance float64) *Vec3 {
	return r.Origin.Plus(r.Direction.Multiply(distance))
}

func (r *Ray) DistanceToSphere(center *Vec3, radius float64) (float64, bool) {
	origin2Center := r.Origin.Minus(center)

	a := r.Direction.Dot(r.Direction)
	bHalf := origin2Center.Dot(r.Direction)
	c := origin2Center.Dot(origin2Center) - radius*radius

	discriminant := bHalf*bHalf - a*c
	if discriminant < 0 {
		return 0, false
	}

	return -bHalf - math.Sqrt(discriminant)/a, true
}
