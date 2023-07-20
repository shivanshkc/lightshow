package mats

import (
	"raytracing/pkg/utils"
)

// Metallic implements the material interface as a metal (a shiny surface).
type Metallic struct {
	Attenuation *utils.Colour
	// Fuzz represents how fuzzy the metal should look.
	// To know more, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#metal/fuzzyreflection
	Fuzz float64
}

// NewMetallic returns a new Metallic material instance.
func NewMetallic(attn *utils.Colour, fuzz float64) *Metallic {
	return &Metallic{Attenuation: attn, Fuzz: fuzz}
}

func (m *Metallic) Scatter(ray *utils.Ray, hitInfo *RayHit) (*utils.Ray, *utils.Colour, bool) {
	// Get the reflection of the ray.
	reflected := ray.Dir.Reflected(hitInfo.Normal)

	// To understand why we're using a random vector in unit sphere here, go to-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#metal/fuzzyreflection
	scatteredDir := reflected.Add(utils.Random.Vec3InUnitSphere().Mul(m.Fuzz)).Dir()
	scattered := utils.NewRay(hitInfo.Point, scatteredDir)

	return scattered, m.Attenuation, scatteredDir.Dot(hitInfo.Normal) > 0
}
