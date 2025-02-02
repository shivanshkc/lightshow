package shapes

import (
	"sort"

	"github.com/shivanshkc/lightshow/pkg/mats"
	"github.com/shivanshkc/lightshow/pkg/random"
	"github.com/shivanshkc/lightshow/pkg/utils"
)

// BVHNode represents a node of the BVH tree, where BVH stands for Bounding Volume Hierarchy.
type BVHNode struct {
	Left  Shape
	Right Shape
	Box   *AABB
}

// NewBVHNode creates a BVH tree with the given shapes and returns the top level BVHNode.
func NewBVHNode(shapes ...Shape) *BVHNode {
	// This variables will hold the left and right nodes for this node.
	var left, right Shape

	// Axis can have values 0, 1 and 2.
	// 0 means x, 1 means y and 2 means z.
	axis := random.IntBetween(0, 2)
	comparator := func(i, j int) bool {
		return shapes[i].BoundingBox().Min.D[axis] < shapes[j].BoundingBox().Min.D[axis]
	}

	switch len(shapes) {
	case 0:
		panic("no shapes specified")
	case 1:
		left, right = shapes[0], shapes[0]
	case 2:
		sort.SliceStable(shapes, comparator)
		left, right = shapes[0], shapes[1]
	default:
		sort.SliceStable(shapes, comparator)
		left = NewBVHNode(shapes[:len(shapes)/2]...)
		right = NewBVHNode(shapes[len(shapes)/2:]...)
	}

	boxLeft, boxRight := left.BoundingBox(), right.BoundingBox()
	return &BVHNode{Left: left, Right: right, Box: boxLeft.BoundingBoxWith(boxRight)}
}

// Hit method for a BVH node checks if the given ray hits the node's own box, if not, it returns right away.
// Otherwise, it returns the closest hit out of the left and right boxes.
func (b *BVHNode) Hit(ray utils.Ray, minD, maxD float64) (*mats.RayHit, bool) {
	// If this box is not hit, it is guaranteed that left and right boxes won't be hit either, so we return.
	if !b.Box.Hit(ray, minD, maxD) {
		return nil, false
	}

	// See if the left box is hit.
	recordLeft, isHitLeft := b.Left.Hit(ray, minD, maxD)
	// If the left box is hit, update the maxD param as we want the next hit to be closer.
	if isHitLeft {
		maxD = recordLeft.Distance
	}

	// See if the right box is hit.
	recordRight, isHitRight := b.Right.Hit(ray, minD, maxD)
	// If the right box is hit, it is definitely a better hit than the left box.
	// This is because we used the distance of the left-hit as the maxD param here.
	if isHitRight {
		return recordRight, true
	}

	// The right box wasn't hit. So, we check if the left one was hit.
	if isHitLeft {
		return recordLeft, true
	}

	// No box was hit.
	return nil, false
}

func (b *BVHNode) BoundingBox() *AABB {
	return b.Box
}
