package pkg

type Ray struct {
	Origin    *Vec3
	Direction *Vec3
}

func NewRay(origin *Vec3, direction *Vec3) *Ray {
	return &Ray{Origin: origin, Direction: direction}
}
