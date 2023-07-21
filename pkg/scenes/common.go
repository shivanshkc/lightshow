package scenes

import (
	"illuminate/pkg/mats"
	"illuminate/pkg/shapes"
	"illuminate/pkg/utils"
)

// Ground is a very large sphere to act as ground.
var Ground = &shapes.Sphere{
	Center: utils.NewVec3(0, -100000, 0),
	Radius: 100000,
	Mat:    mats.NewMatte(utils.NewColour(0.5, 0.5, 0.5)),
}

// GlassBall can be used to quickly render a glass ball.
var GlassBall = &shapes.Sphere{
	Center: utils.NewVec3(0, 1, 0),
	Radius: 1.0,
	Mat:    mats.NewGlass(1.5),
}

// MatteBall can be used to quickly render a matte ball.
var MatteBall = &shapes.Sphere{
	Center: utils.NewVec3(0, 1, 0),
	Radius: 1.0,
	Mat:    mats.NewMatte(utils.NewColour(0.4, 0.2, 0.1)),
}

// GlassBall can be used to quickly render a glass ball.
var MetalBall = &shapes.Sphere{
	Center: utils.NewVec3(0, 1, 0),
	Radius: 1.0,
	Mat:    mats.NewMetallic(utils.NewColour(0.7, 0.5, 0.3), 0),
}
