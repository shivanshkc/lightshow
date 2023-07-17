package pkg

type Camera struct {
	AspectRatio    float64
	ViewportHeight float64
	ViewportWidth  float64
	// FocalLength is the distance from screen.
	FocalLength float64

	Origin          *Vec3
	Horizontal      *Vec3
	Vertical        *Vec3
	LowerLeftCorner *Vec3
}

func NewCamera(aspectRatio, vpHeight, focalLength float64) *Camera {
	vpWidth := vpHeight * aspectRatio

	cam := &Camera{
		AspectRatio:    aspectRatio,
		ViewportHeight: vpHeight,
		ViewportWidth:  vpWidth,
		FocalLength:    focalLength,
		Origin:         NewVector(0, 0, 0),
		Horizontal:     NewVector(vpWidth, 0, 0),
		Vertical:       NewVector(0, vpHeight, 0),
	}

	cam.LowerLeftCorner = cam.Origin.
		Minus(cam.Horizontal.Divide(2)).
		Minus(cam.Vertical.Divide(2)).
		Minus(NewVector(0, 0, cam.FocalLength))

	return cam
}

func (c *Camera) GetRay(screenX, screenY float64) *Ray {
	rayDirection := c.LowerLeftCorner.
		Plus(c.Horizontal.Multiply(screenX)).
		Plus(c.Vertical.Multiply(screenY)).
		Direction()

	return NewRay(c.Origin, rayDirection)
}
