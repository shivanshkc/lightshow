package scenes

import (
	"illuminate/pkg/mats"
	"illuminate/pkg/shapes"
	"illuminate/pkg/utils"
)

// Random generates a randomized shape group (a group of shapes).
func Random() *shapes.Group {
	var allShapes []shapes.Shape
	rnd := utils.Random

	for x := -11.0; x < 11; x++ {
		for y := -11.0; y < 11; y++ {
			center := utils.NewVec3(x+0.9*rnd.Float(), 0.2, y*0.9*rnd.Float())
			if center.Sub(utils.NewVec3(4, 0.2, 0)).Mag() <= 0.9 {
				continue
			}

			matDecider := rnd.Float()
			var shape shapes.Shape

			if matDecider < 0.33 {
				shape = &shapes.Sphere{
					Center: center,
					Radius: 0.2,
					Mat:    mats.NewMatte(utils.Random.Vec3().ToColour()),
				}
			} else if matDecider < 0.67 {
				shape = &shapes.Sphere{
					Center: center,
					Radius: 0.2,
					Mat: mats.NewMetallic(
						utils.Random.Vec3().ToColour(),
						utils.Random.FloatBetween(0, 0.5),
					)}
			} else {
				shape = &shapes.Sphere{
					Center: center,
					Radius: 0.2,
					Mat:    mats.NewGlass(1.5),
				}
			}

			allShapes = append(allShapes, shape)
		}
	}

	allShapes = append(allShapes, Ground)
	allShapes = append(allShapes, GlassBall)

	MatteBall.Center = utils.NewVec3(-4, 1, 0)
	allShapes = append(allShapes, MatteBall)

	MetalBall.Center = utils.NewVec3(4, 1, 0)
	allShapes = append(allShapes, MetalBall)

	return shapes.NewGroup(allShapes...)
}
