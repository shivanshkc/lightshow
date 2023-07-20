package mats

import (
	"math"
	"raytracing/pkg/utils"
)

// Glass implements the material interface as a glassy or dielectric surface.
type Glass struct {
	// RefractiveIndex of the material.
	// For reference, RI if 1 for air, 1.3-1.7 for glass and 2.4 for diamond.
	RefractiveIndex float64
}

// NewGlass returns a new Glass material instance.
func NewGlass(ri float64) *Glass {
	return &Glass{RefractiveIndex: ri}
}

func (g *Glass) Scatter(ray *utils.Ray, hitInfo *RayHit) (*utils.Ray, *utils.Colour, bool) {
	// This method uses the physics of Total Internal Reflection and Schlick's approximation.
	// To know more, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#dielectrics/refraction

	// rir is the Refractive Index Ratio.
	rir := g.RefractiveIndex
	if hitInfo.IsRayOutside {
		rir = 1 / rir
	}

	// Safely calculating cosine and sine.
	cosine := math.Min(ray.Dir.Mul(-1).Dot(hitInfo.Normal), 1)
	sine := math.Sqrt(1 - cosine*cosine)

	// The material cannot refract when the value of sine(thetaPrime) goes above 1,
	// where thetaPrime is the angle of refraction.
	cannotRefract := rir*sine > 1

	// Determine whether the ray will be reflected or refracted.
	var scatterDir *utils.Vec3
	if cannotRefract || schlickApprox(cosine, rir) > utils.Random.Float() {
		scatterDir = ray.Dir.Reflected(hitInfo.Normal)
	} else {
		scatterDir = ray.Dir.Refracted(hitInfo.Normal, rir)
	}

	return utils.NewRay(hitInfo.Point, scatterDir), utils.NewColour(1, 1, 1), true
}

// schlickApprox approximates the reflectance of a dielectric material for the given
// angle of incidence (cosine) and refractive index ratio (rir).
//
// To know more, visit-
// https://raytracing.github.io/books/RayTracingInOneWeekend.html#dielectrics/schlickapproximation
func schlickApprox(cosine, rir float64) float64 {
	r0 := math.Pow((1-rir)/(1+rir), 2)
	return r0 + (1-r0)*math.Pow(1-cosine, 5)
}
