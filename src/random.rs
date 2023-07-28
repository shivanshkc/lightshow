use crate::vec3::Vec3;
use rand::{rngs::ThreadRng, Rng};

/// vec3_in_unit_disk returns a random Vec3 inside a unit disk.
pub fn vec3_in_unit_disk(rng: &mut ThreadRng) -> Vec3 {
    // TODO: Is there a better way than this semi-brute-force?
    loop {
        let vec = Vec3::new(rng.gen_range(-1.0..1.0), rng.gen_range(-1.0..1.0), 0.0);

        if vec.dot_self() < 1.0 {
            return vec;
        }
    }
}
