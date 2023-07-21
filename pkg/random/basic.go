package random

import (
	"time"
)

// Float uses the Xoshiro256StarStar algorithm for generating
// high-quality pseudo-random numbers within the [0, 1) interval.
func Float() float64 {
	seed := uint64(time.Now().Nanosecond())
	result := rotl64(splitmix64(seed)*5, 7) * 9
	return float64(result) / (1 << 64)
}

// FloatBetween generates a random float between the given min and max range.
func FloatBetween(min, max float64) float64 {
	return min + (Float() * (max - min))
}

// rotl64 is a helper function for the Xoshiro256StarStar algorithm.
func rotl64(x uint64, k uint) uint64 {
	return (x << k) | (x >> (64 - k))
}

// splitmix64 is a helper function for the Xoshiro256StarStar algorithm.
func splitmix64(seed uint64) uint64 {
	var z uint64 = (seed + 0x9E3779B97F4A7C15)
	z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9
	z = (z ^ (z >> 27)) * 0x94D049BB133111EB
	return z ^ (z >> 31)
}
