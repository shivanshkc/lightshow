/// Colour is an RGB colour.
pub struct Colour {
    components: [f64; 3],
}

impl Colour {
    /// Constructor.
    pub fn new(r: f64, g: f64, b: f64) -> Self {
        Colour { components: [r, g, b] }
    }

    /// to_ppm converts the colour to a PPM row.
    pub fn to_ppm(&self) -> String {
        format!(
            "{} {} {}",
            // Multiply all colour components to bring them to 0-255 range.
            (self.r() * 255.99) as i64,
            (self.g() * 255.99) as i64,
            (self.b() * 255.99) as i64
        )
    }

    /// r component of the colour.
    #[inline]
    pub fn r(&self) -> f64 {
        self.components[0]
    }

    /// g component of the colour.
    #[inline]
    pub fn g(&self) -> f64 {
        self.components[1]
    }

    /// b component of the colour.
    #[inline]
    pub fn b(&self) -> f64 {
        self.components[2]
    }
}
