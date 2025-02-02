package utils

import (
	"math"
)

// Vec3 is a 3D vector.
type Vec3 struct {
	D [3]float64
}

// NewVec3 creates a new Vec3.
func NewVec3(x, y, z float64) Vec3 {
	return Vec3{[3]float64{x, y, z}}
}

// Add adds the given vector to this vector
// and returns the result.
func (v Vec3) Add(arg Vec3) Vec3 {
	return NewVec3(v.D[0]+arg.D[0], v.D[1]+arg.D[1], v.D[2]+arg.D[2])
}

// Sub subtracts the given vector from this vector
// and returns the result.
func (v Vec3) Sub(arg Vec3) Vec3 {
	return NewVec3(v.D[0]-arg.D[0], v.D[1]-arg.D[1], v.D[2]-arg.D[2])
}

// Mul multiplies the vector with the given argument
// and returns the result.
func (v Vec3) Mul(arg float64) Vec3 {
	return NewVec3(v.D[0]*arg, v.D[1]*arg, v.D[2]*arg)
}

// Div divides the vector with the given argument
// and returns the result.
func (v Vec3) Div(arg float64) Vec3 {
	arg = 1 / arg
	return NewVec3(v.D[0]*arg, v.D[1]*arg, v.D[2]*arg)
}

// Dot calculates the dot product of this vector with the given vector.
func (v Vec3) Dot(arg Vec3) float64 {
	return v.D[0]*arg.D[0] + v.D[1]*arg.D[1] + v.D[2]*arg.D[2]
}

// DotSelf returns the dot product of the vector with itself.
// It is equivalent to its magnitude squared.
func (v Vec3) DotSelf() float64 {
	return v.Dot(v)
}

// Cross calculates the cross product of this vector with the given vector
// and returns the result.
func (v Vec3) Cross(arg Vec3) Vec3 {
	return NewVec3(
		v.D[1]*arg.D[2]-v.D[2]*arg.D[1],
		v.D[2]*arg.D[0]-v.D[0]*arg.D[2],
		v.D[0]*arg.D[1]-v.D[1]*arg.D[0],
	)
}

// Mag calculates the magnitude of the vector.
func (v Vec3) Mag() float64 {
	return math.Sqrt(v.DotSelf())
}

// Dir calculates the direction (or unit vector) of this vector.
func (v Vec3) Dir() Vec3 {
	return v.Div(v.Mag())
}

// ToColour converts this vector to a Colour type by mapping
// the x, y, z values to r, g, b values respectively.
func (v Vec3) ToColour() Colour {
	return Colour(v)
}

// Reflected calculates and returns the reflection of this vector
// for the given normal.
//
// To understand the formula, go to -
// https://raytracing.github.io/books/RayTracingInOneWeekend.html#metal/mirroredlightreflection
func (v Vec3) Reflected(normal Vec3) Vec3 {
	return v.Sub(normal.Mul(v.Dot(normal) * 2))
}

// Refracted calculates and returns the refraction of this vector
// for the given normal and refractive-index-ratio.
//
// The second parameter (named "rir") is the refractive-index-ratio.
// It is equal to the refractive index of the destination material divided
// by the refractive index of the source material.
//
// For more information, go to -
// https://raytracing.github.io/books/RayTracingInOneWeekend.html#dielectrics/snell'slaw
func (v Vec3) Refracted(normal Vec3, rir float64) Vec3 {
	// These are the perpendicular and parallel components of the refracted ray respectively.
	// The final result will be the addition of these components.
	var perpendicular, parallel Vec3

	// Calculating the incidence direction beforehand to save calculation time.
	vDir := v.Dir()
	// Cosine of the angle between the incident ray and the normal.
	cosine := vDir.Mul(-1).Dot(normal)
	// Value of cosine should never exceed 1.
	cosine = math.Min(cosine, 1)

	// Calculate the components.
	perpendicular = vDir.Add(normal.Mul(cosine)).Mul(rir)
	parallel = normal.Mul(-math.Sqrt(math.Abs(1 - perpendicular.DotSelf())))

	// Get the final result by adding the two components.
	return perpendicular.Add(parallel)
}

// Lerp stands for Linear Interpolation.
//
// The formula for linear interpolation is given by:
// final = (1 - x) * start + x * end.
func (v Vec3) Lerp(end Vec3, x float64) Vec3 {
	return v.Mul(1 - x).Add(end.Mul(x))
}

// IsNearZero returns true if ALL components of the vector are "very" close to zero.
func (v Vec3) IsNearZero() bool {
	precision := 0.00001
	return v.D[0] < precision && v.D[1] < precision && v.D[2] < precision
}
