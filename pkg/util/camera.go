package util

// Camera is nothing but the origin of all rays.
// It can also be considered an eye.
type Camera struct {
	// CamU, CamV and CamW are three vectors that together fully
	// describe the position and orientation of the camera.
	CamU, CamV, CamW *Vec3
}

// NewCamera returns a new camera instance.
func NewCamera() *Camera {
	return nil
}

// CastRay returns a Ray instance that originates at the camera's origin
// and goes toward the given xy location on the viewport.
func (c *Camera) CastRay(viewportX, viewportY float64) *Ray {
	return nil
}
