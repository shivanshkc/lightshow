package pkg

import "math"

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

func NewCamera(
	lookFrom, lookAt, up *Vec3,
	verticalFoV, aspectRatio float64,
) *Camera {
	vFovRad := deg2Rad(verticalFoV)
	heightFactor := math.Tan(vFovRad / 2)

	vpHeight := 2.0 * heightFactor
	vpWidth := aspectRatio * vpHeight

	cameraW := lookFrom.Minus(lookAt).Direction()
	cameraU := up.Cross(cameraW).Direction()
	cameraV := cameraW.Cross(cameraU)

	cam := &Camera{
		AspectRatio:    aspectRatio,
		ViewportHeight: vpHeight,
		ViewportWidth:  vpWidth,
		FocalLength:    1.0,
		Origin:         lookFrom,
		Horizontal:     cameraU.Multiply(vpWidth),
		Vertical:       cameraV.Multiply(vpHeight),
	}

	cam.LowerLeftCorner = cam.Origin.
		Minus(cam.Horizontal.Divide(2)).
		Minus(cam.Vertical.Divide(2)).
		Minus(cameraW)

	return cam
}

func (c *Camera) GetRay(screenX, screenY float64) *Ray {
	rayDirection := c.LowerLeftCorner.
		Plus(c.Horizontal.Multiply(screenX)).
		Plus(c.Vertical.Multiply(screenY)).
		Minus(c.Origin).
		Direction()

	return NewRay(c.Origin, rayDirection)
}

func deg2Rad(deg float64) float64 {
	return deg * math.Pi / 180
}
