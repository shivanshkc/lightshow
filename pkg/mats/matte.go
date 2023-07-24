package mats

import (
	"github.com/shivanshkc/lightshow/pkg/random"
	"github.com/shivanshkc/lightshow/pkg/utils"
)

// Matte implements the material interface as a matte or Lambertian material.
type Matte struct {
	albedo utils.Colour
}

// NewMatte returns a new Matte material.
func NewMatte(albedo utils.Colour) *Matte {
	return &Matte{albedo: albedo}
}

func (m *Matte) Scatter(_ utils.Ray, hitInfo *RayHit) (utils.Ray, utils.Colour, bool) {
	scatterDir := hitInfo.Normal.Add(random.UnitVec3())

	// Catch degenerate scatter direction.
	if scatterDir.IsNearZero() {
		scatterDir = hitInfo.Normal
	}

	return utils.NewRay(hitInfo.Point, scatterDir), m.albedo, true
}
