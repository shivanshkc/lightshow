package material

import (
	"math"
	"raytracing/pkg"
)

type Dielectric struct {
	RefractiveIndex float64
}

func (d *Dielectric) Scatter(incomingRay *pkg.Ray, hitPoint,
	hitNormal *pkg.Vec3, isNormalOutward bool,
) (*pkg.Ray, *pkg.Colour, bool) {
	refractionRatio := d.RefractiveIndex
	if isNormalOutward {
		refractionRatio = 1 / refractionRatio
	}

	incomingDir := incomingRay.Direction.Direction()

	cosTheta := math.Min(incomingDir.Multiply(-1).Dot(hitNormal), 1)
	sinTheta := math.Sqrt(1 - cosTheta*cosTheta)

	cannotRefract := refractionRatio*sinTheta > 1

	var scatterDir *pkg.Vec3
	if cannotRefract || d.schlickAppoximation(cosTheta, refractionRatio) > pkg.RandomFloat() {
		scatterDir = incomingDir.Reflection(hitNormal)
	} else {
		scatterDir = incomingDir.Refraction(hitNormal, refractionRatio)
	}

	scattered := pkg.NewRay(hitPoint, scatterDir.Direction())
	return scattered, pkg.NewColour(1, 1, 1), true
}

func (d *Dielectric) schlickAppoximation(cosine, refractionRatio float64) float64 {
	r0 := math.Pow((1-refractionRatio)/(1+refractionRatio), 2)
	return r0 + (1-r0)*math.Pow(1-cosine, 5)
}
