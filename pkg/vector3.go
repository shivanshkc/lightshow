package pkg

import "math"

type Vec3 struct {
	X float64
	Y float64
	Z float64
}

func NewVector(x, y, z float64) *Vec3 {
	return &Vec3{X: x, Y: y, Z: z}
}

func (v *Vec3) Plus(vec *Vec3) *Vec3 {
	return NewVector(v.X+vec.X, v.Y+vec.Y, v.Z+vec.Z)
}

func (v *Vec3) Minus(vec *Vec3) *Vec3 {
	return NewVector(v.X-vec.X, v.Y-vec.Y, v.Z-vec.Z)
}

func (v *Vec3) Multiply(arg float64) *Vec3 {
	return NewVector(v.X*arg, v.Y*arg, v.Z*arg)
}

func (v *Vec3) Divide(arg float64) *Vec3 {
	return v.Multiply(1 / arg)
}

func (v *Vec3) Dot(vec *Vec3) float64 {
	return v.X*vec.X + v.Y*vec.Y + v.Z*vec.Z
}

func (v *Vec3) Magnitude() float64 {
	return math.Sqrt(v.Dot(v))
}

func (v *Vec3) Direction() *Vec3 {
	return v.Divide(v.Magnitude())
}

func (v *Vec3) Reflection(normal *Vec3) *Vec3 {
	return v.Minus(normal.Multiply(v.Dot(normal)).Multiply(2))
}

func (v *Vec3) IsNearZero() bool {
	limit := 0.00001
	return v.X < limit && v.Y < limit && v.Z < limit
}
