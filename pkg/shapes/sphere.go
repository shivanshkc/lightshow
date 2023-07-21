package shapes

import (
	"math"

	"github.com/shivanshkc/illuminate/pkg/mats"
	"github.com/shivanshkc/illuminate/pkg/utils"
)

// Sphere represents the sphere shape. It implements the Shape interface.
type Sphere struct {
	// Center is the position vector for the center of the sphere.
	Center *utils.Vec3
	// Radius of the sphere.
	Radius float64

	// Mat is the material of the sphere.
	Mat mats.Material
}

// NewSphere returns a new sphere.
func NewSphere(center *utils.Vec3, radius float64, mat mats.Material) *Sphere {
	return &Sphere{Center: center, Radius: radius, Mat: mat}
}

func (s *Sphere) Hit(ray *utils.Ray, minD, maxD float64) (*mats.RayHit, bool) {
	// To understand the math, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#addingasphere/ray-sphereintersection

	oc := ray.Origin.Sub(s.Center)

	// These are the coefficients of the quadractic equation.
	// To understand the "bHalf" logic, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#surfacenormalsandmultipleobjects/simplifyingtheray-sphereintersectioncode
	a := ray.Dir.DotSelf()
	bHalf := oc.Dot(ray.Dir)
	c := oc.DotSelf() - s.Radius*s.Radius

	// The simplified discriminant of the equation.
	discriminant := bHalf*bHalf - a*c
	if discriminant < 0 {
		// No hit occurred.
		return nil, false
	}

	// To save calculations.
	sqrtDiscrim := math.Sqrt(discriminant)

	// The smaller root of the equation.
	closerRoot := (-bHalf - sqrtDiscrim) / a
	if !isWithin(closerRoot, minD, maxD) {
		// The bigger root of the equation.
		closerRoot = (-bHalf + sqrtDiscrim) / a
		if !isWithin(closerRoot, minD, maxD) {
			// Both hits are out of visual range.
			return nil, false
		}
	}

	// Create the RayHit record.
	rayHit := &mats.RayHit{
		Point:    ray.Point(closerRoot),
		Distance: closerRoot,
		Mat:      s.Mat,
	}

	// Calculate the normal and whether is it on the same side as the Ray.
	rayHit.Normal = rayHit.Point.Sub(s.Center).Dir()
	// To understand this math, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#surfacenormalsandmultipleobjects/frontfacesversusbackfaces
	rayHit.IsRayOutside = ray.Dir.Dot(rayHit.Normal) < 0
	if !rayHit.IsRayOutside {
		rayHit.Normal = rayHit.Normal.Mul(-1)
	}

	return rayHit, true
}

// isWithin checks if the given value is within min and max, both exclusive.
func isWithin(value, min, max float64) bool {
	return value > min && value < max
}
