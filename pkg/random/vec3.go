package random

import (
	"github.com/shivanshkc/lightshow/pkg/utils"
)

// Vec3 generates a random Vec3 whose all components lie between [0, 1).
func Vec3() utils.Vec3 {
	return utils.NewVec3(Float(), Float(), Float())
}

// Vec3Between generates a random Vec3 whose all components lie between
// the given min and max range.
func Vec3Between(min, max float64) utils.Vec3 {
	return utils.NewVec3(
		FloatBetween(min, max),
		FloatBetween(min, max),
		FloatBetween(min, max),
	)
}

// UnitVec3 returns a random unit Vec3.
func UnitVec3() utils.Vec3 {
	return Vec3().Dir()
}

// Vec3InUnitSphere returns a random Vec3 inside a unit sphere.
func Vec3InUnitSphere() utils.Vec3 {
	// TODO: Is there a better way than this semi-brute-force?
	for {
		point := Vec3Between(-1, 1)
		if point.DotSelf() < 1 {
			return point
		}
	}
}

// Vec3InUnitDisk returns a random Vec3 inside a unit disk.
func Vec3InUnitDisk() utils.Vec3 {
	// TODO: Is there a better way than this semi-brute-force?
	for {
		vec := utils.NewVec3(FloatBetween(-1, 1), FloatBetween(-1, 1), 0)
		if vec.DotSelf() < 1 {
			return vec
		}
	}
}
