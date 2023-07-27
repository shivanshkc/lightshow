use crate::colour::Colour;

/// Renderer uses raytracing to render images.
pub struct Renderer {
    pub opts: Options
}

/// Options to create a new renderer.
pub struct Options {
    pub image_width: i64,
    pub image_height: i64,
}

impl Renderer {
    /// Constructor.
    pub fn new(opts: Options) -> Self {
        Renderer {opts}
    }

    /// render triggers the rendering process.
    pub fn render(&self) {
        // PPM image file headers.
        println!("P3");
        println!("{} {}", self.opts.image_width, self.opts.image_height);
        println!("255");

        // Nested loop over image height and width to handle each pixel.
        for j in 0..self.opts.image_height {
            for i in 0..self.opts.image_width {
                // Reversing "j" because PPM starts drawing from top-left.
                let j_rev = self.opts.image_height - 1 - j;

                // x and y will be in the interval [0, 1].
                let x = i as f64 / (self.opts.image_width as f64 - 1.0);
                let y = j_rev as f64 / (self.opts.image_height as f64 - 1.0);

                // The rendering part.
                let colour = self.render_pixel_aa(x, y);
                // Output.
                println!("{}", colour.to_ppm())
            }
        }
    }

    /// render_pixel_aa renders the given pixel with anti-aliasing.
    fn render_pixel_aa(&self, i: f64, j: f64) -> Colour {
        return Colour::new(i, j, 0.25)
    }
}
