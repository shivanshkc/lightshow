/// Vec3 is a 3D vector.
#[derive(Clone, Copy)]
pub struct Vec3 {
    comp: [f32; 3],
}

impl Vec3 {
    /// Constructor.
    pub fn new(x: f32, y: f32, z: f32) -> Self {
        Vec3 { comp: [x, y, z] }
    }

    /// mag returns the magnitude/length of the vector.
    pub fn mag(&self) -> f32 {
        (self.x() * self.x() + self.y() * self.y() + self.z() * self.z()).sqrt()
    }

    /// dir returns the corresponding unit vector.
    pub fn dir(&self) -> Vec3 {
        *self / self.mag()
    }

    /// dot product with another vector.
    pub fn dot(&self, other: &Vec3) -> f32 {
        self.x() * other.x() + self.y() * other.y() + self.z() * other.z()
    }

    /// dot_self returns dot product with itself.
    pub fn dot_self(&self) -> f32 {
        self.dot(self)
    }

    /// cross product with another vector.
    pub fn cross(&self, other: &Vec3) -> Vec3 {
        Vec3::new(
            self.y() * other.z() - self.z() * other.y(),
            self.z() * other.x() - self.x() * other.z(),
            self.x() * other.y() - self.y() * other.x(),
        )
    }

    /// x component of the vector.
    #[inline]
    pub fn x(&self) -> f32 {
        self.comp[0]
    }

    /// y component of the vector.
    #[inline]
    pub fn y(&self) -> f32 {
        self.comp[1]
    }

    /// z component of the vector.
    #[inline]
    pub fn z(&self) -> f32 {
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
impl std::ops::Mul<f32> for Vec3 {
    type Output = Vec3;

    fn mul(self, arg: f32) -> Vec3 {
        Vec3::new(self.x() * arg, self.y() * arg, self.z() * arg)
    }
}

/// Operator overload for division.
impl std::ops::Div<f32> for Vec3 {
    type Output = Vec3;

    fn div(self, arg: f32) -> Vec3 {
        self * (1.0 / arg)
    }
}
