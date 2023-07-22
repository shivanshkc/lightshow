package utils

// Ray represents a ray of light.
type Ray struct {
	Origin, Dir *Vec3
}

// NewRay returns a new ray instance.
func NewRay(origin, dir *Vec3) *Ray {
	return &Ray{Origin: origin, Dir: dir.Dir()}
}

// Point returns a point on the ray that is given distance
// away from the ray's origin.
func (r *Ray) Point(distance float64) *Vec3 {
	return r.Origin.Add(r.Dir.Mul(distance))
}
