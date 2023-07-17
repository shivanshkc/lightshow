package pkg

import (
	"math"
)

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

func (v *Vec3) Magnitude() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z)
}

func (v *Vec3) Direction() *Vec3 {
	return v.Divide(v.Magnitude())
}
