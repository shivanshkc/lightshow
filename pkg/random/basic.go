package random

import (
	"math/rand"
	"time"
)

// Create a random number generator locally.
var _randSeed = int64(time.Now().Nanosecond())
var _randGen = rand.New(rand.NewSource(_randSeed))

// Float generates a random float in [0, 1)
func Float() float64 {
	return _randGen.Float64()
}

// FloatBetween generates a random float between the given min and max range.
func FloatBetween(min, max float64) float64 {
	return min + (Float() * (max - min))
}
