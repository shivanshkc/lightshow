use crate::{colour::Colour, ray::Ray, vec3::Vec3};

/// Material for an object. It allows for different ray scattering behaviours.
/// For example: shiny, translucent, matte etc.
pub trait Material {
    /// scatter attempts to scatter the inbound ray using the info present in
    /// the RayHit instance.
    ///
    /// The return values include the scattered ray, the attenuation of the
    /// material and a flag that tells whether the ray was scattered at all.
    /// If a ray is not scattered, the material at that point should appear black.
    fn scatter(&self, ray: Ray, info: RayHit) -> (Ray, Colour, bool);
}

/// RayHit encapsulates the information regarding a ray hit.
/// TODO: Is this the correct package for this struct?
pub struct RayHit {
    /// point is the position vector of the point-of-hit.
    pub point: Vec3,
    /// distance of the point-of-hit from the ray origin.
    pub distance: f32,

    /// normal vector to the surface at the point-of-hit.
    pub normal: Vec3,
    /// is_ray_outside tells whether the ray hit occurs inside or outside the shape.
    /// This is calculated using the dot product of the ray direction and the normal.
    /// For more details, visit-
    /// https://raytracing.github.io/books/RayTracingInOneWeekend.html#surfacenormalsandmultipleobjects/frontfacesversusbackfaces
    pub is_ray_outside: bool,

    /// mat is the material of the shape.
    pub mat: dyn Material,
}
