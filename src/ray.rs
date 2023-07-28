use crate::vec3::Vec3;

/// Ray represents a ray of light.
pub struct Ray {
    pub origin: Vec3,
    pub dir: Vec3,
}

impl Ray {
    /// Constructor.
    pub fn new(origin: Vec3, dir: Vec3) -> Ray {
        Ray {
            origin: origin,
            dir: dir.dir(),
        }
    }

    pub fn at(&self, distance: f32) -> Vec3 {
        self.origin + self.dir * distance
    }
}
