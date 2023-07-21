package random

import (
	"math/rand"
)

// Float generates a random float in [0, 1)
func Float() float64 {
	return rand.Float64()
}

// FloatBetween generates a random float between the given min and max range.
func FloatBetween(min, max float64) float64 {
	return min + (Float() * (max - min))
}
