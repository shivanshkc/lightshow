package util

import (
	"math"
)

// Camera is nothing but the origin of all rays.
// It can also be considered an eye.
type Camera struct {
	// camU, camV and camW are three vectors that together fully
	// describe the position and orientation of the camera.
	camU, camV, camW *Vec3

	// Camera vector required by the CastRay method.
	origin, horizontal, vertical, lowerLeftCorner *Vec3

	// lensRadius allows depth of field effect.
	lensRadius float64
}

// CameraOptions encapsulates the parameters required to create a camera.
type CameraOptions struct {
	// LookFrom is the position vector of the camera.
	LookFrom *Vec3
	// LookAt is the position vector of the point toward which the camera is pointed.
	LookAt *Vec3
	// Up is the upward direction wrt the camera.
	Up *Vec3

	// AspectRatio for the viewport.
	AspectRatio float64
	// FieldOfViewVertical is the angle in degrees for the camera's vertical field of view.
	FieldOfViewVertical float64

	// Aperture of the camera lens.
	Aperture float64
	// FocusDistance for the depth of field effect.
	FocusDistance float64
}

// NewCamera creates a new camera using the given options.
func NewCamera(opts *CameraOptions) *Camera {
	// Calculate camera u, v, w vectors from LookFrom, LookAt and Up.
	// To understand more, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#positionablecamera/positioningandorientingthecamera
	cameraW := opts.LookFrom.Sub(opts.LookAt).Dir()
	cameraU := opts.Up.Cross(cameraW).Dir()
	cameraV := cameraW.Cross(cameraU)

	// To understand this trigonometry, visit the following-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#positionablecamera/cameraviewinggeometry
	fovRadians := degreeToRadians(opts.FieldOfViewVertical)
	viewportHeight := 2 * math.Tan(fovRadians/2)
	viewportWidth := opts.AspectRatio * viewportHeight

	// To understand the FocusDistance math, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#defocusblur/athinlensapproximation
	origin := opts.LookFrom
	horizontal := cameraU.Mul(viewportWidth * opts.FocusDistance)
	vertical := cameraV.Mul(viewportHeight * opts.FocusDistance)
	lowerLeftCorner := origin.
		Sub(horizontal.Div(2)).
		Sub(vertical.Div(2)).
		Sub(cameraW.Mul(opts.FocusDistance))

	return &Camera{
		camU: cameraU, camV: cameraV, camW: cameraW,
		origin: origin, horizontal: horizontal, vertical: vertical, lowerLeftCorner: lowerLeftCorner,
		lensRadius: opts.Aperture / 2,
	}
}

// CastRay returns a Ray instance that originates at the camera's origin
// and goes toward the given xy location on the viewport.
func (c *Camera) CastRay(viewportX, viewportY float64) *Ray {
	// TODO: Understand this math.
	// Docs are present at-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#defocusblur/generatingsamplerays
	rd := Random.Vec3InUnitDisk().Mul(c.lensRadius)
	offset := c.camU.Mul(rd.X).Add(c.camV.Mul(rd.Y))

	// Determine the direction of the ray for the given viewport xy.
	rayDirection := c.lowerLeftCorner.
		Add(c.horizontal.Mul(viewportX)).
		Add(c.vertical.Mul(viewportY)).
		Sub(c.origin).
		Sub(offset).
		Dir()

	// Create the ray.
	return NewRay(c.origin.Add(offset), rayDirection)
}

// degreeToRadians converts the given degree value to radians.
func degreeToRadians(deg float64) float64 {
	return deg * math.Pi / 180
}
