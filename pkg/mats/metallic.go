package mats

import (
	"github.com/shivanshkc/lightshow/pkg/random"
	"github.com/shivanshkc/lightshow/pkg/utils"
)

// Metallic implements the material interface as a metal (a shiny surface).
type Metallic struct {
	Attenuation utils.Colour
	// Fuzz represents how fuzzy the metal should look.
	// To know more, visit-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#metal/fuzzyreflection
	Fuzz float64
}

// NewMetallic returns a new Metallic material instance.
func NewMetallic(attn utils.Colour, fuzz float64) *Metallic {
	return &Metallic{Attenuation: attn, Fuzz: fuzz}
}

func (m *Metallic) Scatter(ray *utils.Ray, hitInfo *RayHit) (*utils.Ray, utils.Colour, bool) {
	// Get the reflection of the ray.
	reflected := ray.Dir.Reflected(hitInfo.Normal).Dir()

	// To understand why we're using a random vector in unit sphere here, go to-
	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#metal/fuzzyreflection
	scatteredDir := reflected.Add(random.Vec3InUnitSphere().Mul(m.Fuzz)).Dir()
	scattered := utils.NewRay(hitInfo.Point, scatteredDir)

	return scattered, m.Attenuation, scatteredDir.Dot(hitInfo.Normal) > 0
}
