package material

import "raytracing/pkg"

type Metal struct {
	Attenuation *pkg.Colour
	Fuzz        float64
}

func (m *Metal) Scatter(incomingRay *pkg.Ray, hitPoint,
	hitNormal *pkg.Vec3, isNormalOutward bool,
) (*pkg.Ray, *pkg.Colour, bool) {
	reflected := incomingRay.Direction.Reflection(hitNormal)

	rayDir := reflected.
		Direction().
		Plus(pkg.RandomVectorInUnitSphere().Multiply(m.Fuzz)).
		Direction()

	scattered := pkg.NewRay(hitPoint, rayDir)

	isScattered := scattered.Direction.Dot(hitNormal) > 0
	return scattered, m.Attenuation, isScattered
}
