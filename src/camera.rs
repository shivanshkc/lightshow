use std::f32::consts::PI;

use rand::rngs::ThreadRng;

use crate::{random, ray::Ray, vec3::Vec3};

/// Camera is nothing but the origin of all rays.
/// It can also be considered an eye.
pub struct Camera {
    // cam_u, cam_v and cam_w are three vectors that together fully
    // describe the position and orientation of the camera.
    cam_u: Vec3,
    cam_v: Vec3,
    cam_w: Vec3,

    // Camera vectors required by the CastRay method.
    origin: Vec3,
    horizontal: Vec3,
    vertical: Vec3,
    /// ll_corner stands for lower-left corner.
    ll_corner: Vec3,

    /// lens_radius allows depth of field effect.
    lens_radius: f32,
}

/// Options to configure the camera.
pub struct Options {
    /// look_from is the position vector of the camera.
    pub look_from: Vec3,
    /// look_at is the position vector of the point toward which the camera is pointed.
    pub look_at: Vec3,
    // up is the upward direction wrt the camera.
    pub up: Vec3,

    /// aspect_ratio for the viewport.
    pub aspect_ratio: f32,
    /// fov_vertical is the angle in degrees for the camera's vertical field of view.
    pub fov_vertical: f32,

    /// aperture of the camera lens.
    pub aperture: f32,
    /// focus_distance for the depth of field effect.
    pub focus_distance: f32,
}

impl Camera {
    /// Constructor.
    pub fn new(opts: &Options) -> Camera {
        // Calculate camera u, v, w vectors from LookFrom, LookAt and Up.
        // To understand more, visit-
        // https://raytracing.github.io/books/RayTracingInOneWeekend.html#positionablecamera/positioningandorientingthecamera
        let cam_w = (opts.look_from - opts.look_at).dir();
        let cam_u = opts.up.cross(&cam_w).dir();
        let cam_v = cam_w.cross(&cam_u);

        // To understand this trigonometry, visit the following-
        // https://raytracing.github.io/books/RayTracingInOneWeekend.html#positionablecamera/cameraviewinggeometry
        let fov_rad = opts.fov_vertical * PI / 180.0;
        let vp_height = 2.0 * (fov_rad / 2.0).tan();
        let vp_width = opts.aspect_ratio * vp_height;

        // To understand the FocusDistance math, visit-
        // https://raytracing.github.io/books/RayTracingInOneWeekend.html#defocusblur/athinlensapproximation
        let origin = opts.look_from;
        let horizontal = cam_u * vp_width * opts.focus_distance;
        let vertical = cam_v * vp_height * opts.focus_distance;
        let ll_corner =
            origin - (horizontal / 2.0) - (vertical / 2.0) - (cam_w * opts.focus_distance);

        let lens_radius = opts.aperture / 2.0;

        Camera {
            cam_u,
            cam_v,
            cam_w,
            origin,
            horizontal,
            vertical,
            ll_corner,
            lens_radius,
        }
    }

    /// cast_ray returns a Ray instance that originates at the camera's origin
    /// and goes toward the given xy location on the viewport.
    pub fn cast_ray(&self, x: f32, y: f32, rng: &mut ThreadRng) -> Ray {
        // TODO: Understand this math.
        // Docs are present at-
        // https://raytracing.github.io/books/RayTracingInOneWeekend.html#defocusblur/generatingsamplerays
        let rd = random::vec3_in_unit_disk(rng) * self.lens_radius;
        let offset = self.cam_u * rd.x() + self.cam_v * rd.y();

        // Determine the direction of the ray for the given viewport xy.
        let ray_dir =
            (self.ll_corner + self.horizontal * x + self.vertical * y - self.origin - offset).dir();

        // Create and return the ray.
        Ray::new(self.origin + offset, ray_dir)
    }
}
