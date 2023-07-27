/// Vec3 is a 3D vector.
#[derive(Clone, Copy)]
pub struct Vec3 {
    comp: [f64; 3],
}

impl Vec3 {
    /// Constructor.
    fn new(x: f64, y: f64, z: f64) -> Self {
        Vec3 { comp: [x, y, z] }
    }

    /// mag returns the magnitude/length of the vector.
    fn mag(&self) -> f64 {
        (self.x() * self.x() + self.y() * self.y() + self.z() * self.z()).sqrt()
    }

    // Normalize the vector to have a magnitude of 1
    fn dir(&self) -> Vec3 {
        *self / self.mag()
    }

    // Dot product with another vector
    fn dot(&self, other: &Vec3) -> f64 {
        self.x() * other.x() + self.y() * other.y() + self.z() * other.z()
    }

    // Cross product with another vector
    fn cross(&self, other: &Vec3) -> Vec3 {
        Vec3::new(
            self.y() * other.z() - self.z() * other.y(),
            self.z() * other.x() - self.x() * other.z(),
            self.x() * other.y() - self.y() * other.x(),
        )
    }

    // Helper methods for component access
    #[inline]
    fn x(&self) -> f64 {
        self.comp[0]
    }

    #[inline]
    fn y(&self) -> f64 {
        self.comp[1]
    }

    #[inline]
    fn z(&self) -> f64 {
        self.comp[2]
    }
}

/// Operator overload for addition.
impl std::ops::Add<Vec3> for Vec3 {
    type Output = Vec3;

    fn add(self, arg: Vec3) -> Vec3 {
        Vec3::new(self.x() + arg.x(), self.y() + arg.y(), self.z() + arg.z())
    }
}

/// Operator overload for negation.
impl std::ops::Neg for Vec3 {
    type Output = Vec3;

    fn neg(self) -> Vec3 {
        Vec3::new(-self.x(), -self.y(), -self.z())
    }
}

/// Operator overload for subtraction.
impl std::ops::Sub<Vec3> for Vec3 {
    type Output = Vec3;

    fn sub(self, arg: Vec3) -> Vec3 {
        self + (-arg)
    }
}

/// Operator overload for mutliplication.
impl std::ops::Mul<f64> for Vec3 {
    type Output = Vec3;

    fn mul(self, arg: f64) -> Vec3 {
        Vec3::new(self.x() * arg, self.y() * arg, self.z() * arg)
    }
}

/// Operator overload for division.
impl std::ops::Div<f64> for Vec3 {
    type Output = Vec3;

    fn div(self, arg: f64) -> Vec3 {
        self * (1.0 / arg)
    }
}
