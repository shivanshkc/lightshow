package material

import (
	"raytracing/pkg"
)

type Lambertian struct {
	Attenuation *pkg.Colour
}

func (l *Lambertian) Scatter(incomingRay *pkg.Ray, hitPoint,
	hitNormal *pkg.Vec3, isNormalOutward bool,
) (*pkg.Ray, *pkg.Colour, bool) {
	scatterDir := hitNormal.Plus(pkg.RandomVectorInUnitSphere().Direction())

	// Catch degenerate scatter direction
	if scatterDir.IsNearZero() {
		scatterDir = hitNormal
	}

	scattered := pkg.NewRay(hitPoint, scatterDir.Direction())
	return scattered, l.Attenuation, true
}
