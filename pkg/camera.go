package pkg

import (
	"math"
)

type Camera struct {
	AspectRatio     float64
	ViewportHeight  float64
	ViewportWidth   float64
	Origin          *Vec3
	Horizontal      *Vec3
	Vertical        *Vec3
	LowerLeftCorner *Vec3

	CamU, CamV, CamW *Vec3

	LensRadius float64
}

func NewCamera(
	lookFrom, lookAt, up *Vec3,
	verticalFoV, aspectRatio, aperture, focusDist float64,
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
		Origin:         lookFrom,
		Horizontal:     cameraU.Multiply(vpWidth * focusDist),
		Vertical:       cameraV.Multiply(vpHeight * focusDist),
		CamU:           cameraU,
		CamV:           cameraV,
		CamW:           cameraW,
		LensRadius:     aperture / 2,
	}

	cam.LowerLeftCorner = cam.Origin.
		Minus(cam.Horizontal.Divide(2)).
		Minus(cam.Vertical.Divide(2)).
		Minus(cameraW.Multiply(focusDist))

	return cam
}

func (c *Camera) GetRay(screenX, screenY float64) *Ray {
	rd := RandomVectorInUnitDisk().Multiply(c.LensRadius)
	offset := c.CamU.Multiply(rd.X).Plus(c.CamV.Multiply(rd.Y))

	rayDirection := c.LowerLeftCorner.
		Plus(c.Horizontal.Multiply(screenX)).
		Plus(c.Vertical.Multiply(screenY)).
		Minus(c.Origin).
		Minus(offset).
		Direction()

	return NewRay(c.Origin.Plus(offset), rayDirection)
}

func deg2Rad(deg float64) float64 {
	return deg * math.Pi / 180
}
