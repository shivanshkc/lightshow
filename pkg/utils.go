package pkg

import (
	"fmt"
	"math"
)

// TODO: Make a cleaner abstraction for live-average FPS.
// lastTime is required to calculated FPS.
var lastTime float64
var lastAvgFPS float64
var calCount int

// ShowFPS prints the FPS to the standard output.
// It should be called inside the window.ShouldClose loop.
//
// The currentTime value should be glfw.GetTime()
func ShowFPS(currentTime float64) {
	//currentTime := glfw.GetTime()
	currentFPS := 1.0 / (currentTime - lastTime)
	lastTime = currentTime

	lastAvgFPS = (float64(calCount)*lastAvgFPS + currentFPS) / (float64(calCount) + 1)
	fmt.Printf("\rFPS: %v ###", math.Ceil(lastAvgFPS))

	calCount++
}

// CheckErr panics if the given error is not nil and shows the given message.
func CheckErr(err error, msg string) {
	if err != nil {
		panic(fmt.Errorf("%s: %w", msg, err))
	}
}
