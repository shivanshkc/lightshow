package scenes

// func populateWorld() {
// 	for a := -11; a < 11; a++ {
// 		for b := -11; b < 11; b++ {
// 			chooseMat := random.Float()
// 			center := utils.NewVec3(
// 				float64(a)+0.9*random.Float(),
// 				0.2,
// 				float64(b)*0.9*random.Float(),
// 			)

// 			if center.Sub(utils.NewVec3(4, 0.2, 0)).Mag() <= 0.9 {
// 				continue
// 			}

// 			if chooseMat < 0.33 {
// 				sphereMat := mats.NewMatte(random.Vec3().ToColour())
// 				world = append(world, &shapes.Sphere{
// 					Center: center,
// 					Radius: 0.2,
// 					Mat:    sphereMat,
// 				})
// 			} else if chooseMat < 0.67 {
// 				sphereMat := mats.NewMetallic(
// 					random.Vec3().ToColour(),
// 					random.FloatBetween(0, 0.5),
// 				)
// 				world = append(world, &shapes.Sphere{
// 					Center: center,
// 					Radius: 0.2,
// 					Mat:    sphereMat,
// 				})
// 			} else {
// 				sphereMat := mats.NewGlass(1.5)
// 				world = append(world, &shapes.Sphere{
// 					Center: center,
// 					Radius: 0.2,
// 					Mat:    sphereMat,
// 				})
// 			}
// 		}
// 	}

// 	sphereMat1 := mats.NewGlass(1.5)
// 	world = append(world, &shapes.Sphere{
// 		Center: utils.NewVec3(0, 1, 0),
// 		Radius: 1.0,
// 		Mat:    sphereMat1,
// 	})

// 	sphereMat2 := mats.NewMatte(utils.NewColour(0.4, 0.2, 0.1))
// 	world = append(world, &shapes.Sphere{
// 		Center: utils.NewVec3(-4, 1, 0),
// 		Radius: 1.0,
// 		Mat:    sphereMat2,
// 	})

// 	sphereMat3 := mats.NewMetallic(utils.NewColour(0.7, 0.5, 0.3), 0)
// 	world = append(world, &shapes.Sphere{
// 		Center: utils.NewVec3(4, 1, 0),
// 		Radius: 1.0,
// 		Mat:    sphereMat3,
// 	})

// 	world = append(world, &shapes.Sphere{
// 		Center: utils.NewVec3(0, -100000, 0),
// 		Radius: 100000,
// 		Mat:    mats.NewMatte(utils.NewColour(0.5, 0.5, 0.5)),
// 	})
// }
