package hittable

import "raytracing/pkg"

// HittableGroup is a group of hittable objects.
// It implements the Hittable interface itself,
// and returns the hitInfo of the closest object.
type HittableGroup struct {
	Items []Hittable
}

func NewHittableGroup(items []Hittable) *HittableGroup {
	return &HittableGroup{Items: items}
}

func (h *HittableGroup) IsHit(ray *pkg.Ray, tMin, tMax float64) (*HitInfo, bool) {
	var closestHitInfo HitInfo
	closestHitInfo.DistanceFromRayOrigin = tMax // Setting an initial value.

	// This will be true if we hit even a single hittable from the group.
	var hitAnything bool

	for _, item := range h.Items {
		record, isHit := item.IsHit(ray, tMin, closestHitInfo.DistanceFromRayOrigin)
		if !isHit {
			continue
		}

		closestHitInfo = *record
		hitAnything = true
	}

	return &closestHitInfo, hitAnything
}
