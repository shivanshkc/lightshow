package utils

import (
	"math/rand"
	"time"
)

// Random is a global instance of the RandomUtil for ease of use across packages.
var Random *RandomUtil = NewRandom()

// RandomUtil struct encapsulates several random data generating methods.
type RandomUtil struct {
	generator *rand.Rand
}

// NewRandom creates a new Random instance.
func NewRandom() *RandomUtil {
	seed := int64(time.Now().Nanosecond())
	generator := rand.New(rand.NewSource(seed))
	return &RandomUtil{generator: generator}
}

// Float generates a random float in [0, 1)
func (r *RandomUtil) Float() float64 {
	return r.generator.Float64()
}

// FloatBetween generates a random float between the given min and max range.
func (r *RandomUtil) FloatBetween(min, max float64) float64 {
	return min + (r.Float() * (max - min))
}

// Vec3 generates a random Vec3 whose all components lie between [0, 1)
func (r *RandomUtil) Vec3() *Vec3 {
	return NewVec3(r.Float(), r.Float(), r.Float())
}

// UnitVec3 generates a random unit Vec3.
func (r *RandomUtil) UnitVec3() *Vec3 {
	return r.Vec3().Dir()
}

// Vec3InUnitSphere returns a random Vec3 inside a unit sphere.
func (r *RandomUtil) Vec3InUnitSphere() *Vec3 {
	// TODO: Is there a better way than this semi-brute-force?
	for {
		point := r.Vec3()
		if point.DotSelf() < 1 {
			return point
		}
	}
}

// Vec3InUnitDisk returns a random Vec3 inside a unit disk.
func (r *RandomUtil) Vec3InUnitDisk() *Vec3 {
	// TODO: Is there a better way than this semi-brute-force?
	for {
		vec := NewVec3(r.FloatBetween(-1, 1), r.FloatBetween(-1, 1), 0)
		if vec.DotSelf() < 1 {
			return vec
		}
	}
}
