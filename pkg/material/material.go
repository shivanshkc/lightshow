package material

import (
	"raytracing/pkg"
)

type Material interface {
	Scatter(incomingRay *pkg.Ray, hitPoint,
		hitNormal *pkg.Vec3, isNormalOutward bool,
	) (scatteredRay *pkg.Ray, attenuation *pkg.Colour, isScattered bool)
}
