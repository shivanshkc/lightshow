package material

import "raytracing/pkg"

type Metal struct {
	Attenuation *pkg.Colour
	Fuzz        float64
}

func (m *Metal) Scatter(incomingRay *pkg.Ray, hitPoint, hitNormal *pkg.Vec3,
) (*pkg.Ray, *pkg.Colour, bool) {
	reflected := incomingRay.Direction.Reflection(hitNormal)
	scattered := pkg.NewRay(hitPoint, reflected.Direction().
		Plus(pkg.RandomVectorInUnitSphere().Multiply(m.Fuzz)))

	isScattered := scattered.Direction.Dot(hitNormal) > 0
	return scattered, m.Attenuation, isScattered
}
