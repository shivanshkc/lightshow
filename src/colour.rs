/// Colour is an RGB colour.
pub struct Colour {
    comp: [f32; 3],
}

impl Colour {
    /// Constructor.
    pub fn new(r: f32, g: f32, b: f32) -> Self {
        Colour { comp: [r, g, b] }
    }

    /// to_255 converts the colour from a [0, 1] to a [0, 255] representation.
    pub fn to_255(&self) -> (u8, u8, u8) {
        return (
            (self.r() * 255.99) as u8,
            (self.g() * 255.99) as u8,
            (self.b() * 255.99) as u8,
        );
    }

    /// r component of the colour.
    #[inline]
    pub fn r(&self) -> f32 {
        self.comp[0]
    }

    /// g component of the colour.
    #[inline]
    pub fn g(&self) -> f32 {
        self.comp[1]
    }

    /// b component of the colour.
    #[inline]
    pub fn b(&self) -> f32 {
        self.comp[2]
    }
}

/// Operator overload for addition.
impl std::ops::Add<Colour> for Colour {
    type Output = Colour;

    fn add(self, arg: Colour) -> Colour {
        Colour::new(self.r() + arg.r(), self.g() + arg.g(), self.b() + arg.b())
    }
}

/// Operator overload for multiplication.
impl std::ops::Mul<f32> for Colour {
    type Output = Colour;

    fn mul(self, arg: f32) -> Colour {
        Colour::new(self.r() * arg, self.g() * arg, self.b() * arg)
    }
}

/// Operator overload for division.
impl std::ops::Div<f32> for Colour {
    type Output = Colour;

    fn div(self, arg: f32) -> Colour {
        Colour::new(self.r() / arg, self.g() / arg, self.b() / arg)
    }
}
