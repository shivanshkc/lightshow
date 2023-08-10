use std::ops::Range;

use crate::{materials::RayHit, ray::Ray};

/// Object represents any object or entity that can be hit by a ray.
trait Object {
    /// hit attempts to hit the object with the given ray. In other words, it
    /// checks if the surface of the object intersects with the trajectory of the ray.
    ///
    /// The object is considered hit (or intersected) if the point-of-hit lies
    /// within the given distance range.
    ///
    /// If the object is hit, the second return parameter is true and the first return
    /// parameter contains the information about the hit.
    ///
    /// If the point of hit is closer (to the ray origin) than the minimum distance
    /// value or farther than the maximum distance value, the shape will not
    /// be visible.
    ///
    /// In most cases, the minimum of the range will be zero.
    ///
    /// TODO: Is this Box usage a performance issue?
    fn hit(&self, ray: Ray, range: Range<f32>) -> (Box<RayHit>, bool);

    /// bounding_box returns the bounding box for the object.
    ///
    /// If this method is called on a Group type that does not have any shapes, it will panic.
    ///
    /// Bounding boxes are a great way to optimise raytracing.
    /// Read more about them here:
    /// https://raytracing.github.io/books/RayTracingTheNextWeek.html#boundingvolumehierarchies
    fn bounding_box(&self) -> ();
}
