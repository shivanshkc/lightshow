package random

import (
	"hash/maphash"
)

// Float generates a random float in the [0, 1) interval.
//
// It does not use Go's standard random number generator
// because of its poor concurrent performance.
func Float() float64 {
	// This seed generator is much faster than time.Now().
	// TODO: Find an even faster seed generator.
	seed := new(maphash.Hash).Sum64()
	return xoshiro256StarStar(seed)
}

// FloatBetween generates a random float in the [min, max) interval.
func FloatBetween(min, max float64) float64 {
	return min + (Float() * (max - min))
}

// IntBetween generates a random int in the [min, max] interval.
func IntBetween(min, max int) int {
	return int(FloatBetween(float64(min), float64(max+1)))
}

// xoshiro256StarStar is a high-quality pseudo-random number generator (PRNG) algorithm.
func xoshiro256StarStar(seed uint64) float64 {
	result := rotl64(splitmix64(seed)*5, 7) * 9
	return float64(result) / (1 << 64)
}

// rotl64 is a helper function for the Xoshiro256StarStar algorithm.
func rotl64(x uint64, k uint) uint64 {
	return (x << k) | (x >> (64 - k))
}

// splitmix64 is a helper function for the Xoshiro256StarStar algorithm.
func splitmix64(seed uint64) uint64 {
	z := (seed + 0x9E3779B97F4A7C15)
	z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9
	z = (z ^ (z >> 27)) * 0x94D049BB133111EB
	return z ^ (z >> 31)
}
