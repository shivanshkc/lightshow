package pkg

import (
	"math/rand"
	"time"
)

// Create a random number generator.
var _randSeed int64 = int64(time.Now().Nanosecond())
var _randomGen = rand.New(rand.NewSource(_randSeed))

func RandomFloat() float64 {
	return _randomGen.Float64()
}

func RandomVector() *Vec3 {
	return NewVector(RandomFloat(), RandomFloat(), RandomFloat())
}

func RandomVectorInUnitSphere() *Vec3 {
	for {
		point := RandomVector()
		if point.Dot(point) < 1 {
			return point
		}
	}
}

func RandomVectorInHemisphere(normal *Vec3) *Vec3 {
	inUnitSphere := RandomVectorInUnitSphere()
	if inUnitSphere.Dot(normal) > 0 {
		return inUnitSphere
	}
	return inUnitSphere.Multiply(-1)
}
