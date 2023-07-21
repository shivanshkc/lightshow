package random

import (
	"time"
)

const (
	a = 1664525
	c = 1013904223
	m = 1 << 31
)

// Float generates a random float in [0, 1).
func Float() float64 {
	randomInt := (a*time.Now().Nanosecond() + c) % m
	return float64(randomInt) / float64(m)
}

// FloatBetween generates a random float between the given min and max range.
func FloatBetween(min, max float64) float64 {
	return min + (Float() * (max - min))
}
