mod encode;

// TODO: What's the difference between "use crate" and "use"?
use crate::colour::Colour;
use encode::Encoder;
use image::ImageError;

/// Renderer uses raytracing to render images.
pub struct Renderer<'a> {
    pub opts: Options<'a>,
}

/// Options to create a new renderer.
pub struct Options<'a> {
    pub image_width: u32,
    pub image_height: u32,

    pub output_file: &'a str,
}

impl<'a> Renderer<'a> {
    /// Constructor.
    pub fn new(opts: Options<'a>) -> Self {
        Renderer { opts }
    }

    /// render triggers the rendering process.
    pub fn render(&self) -> Result<(), ImageError> {
        let mut encoder = Encoder::new(
            self.opts.output_file,
            self.opts.image_width,
            self.opts.image_height,
        );

        // Nested loop over image height and width to handle each pixel.
        for j in 0..self.opts.image_height {
            for i in 0..self.opts.image_width {
                // Reversing "j" because PPM starts drawing from top-left.
                let j_rev = self.opts.image_height - 1 - j;

                // x and y will be in the interval [0, 1].
                let x = i as f32 / (self.opts.image_width as f32 - 1.0);
                let y = j_rev as f32 / (self.opts.image_height as f32 - 1.0);

                // The rendering part.
                let colour = self.render_pixel_aa(x, y);
                // Write the pixel to the image.
                encoder.put_pixel(i, j, colour);
            }
        }

        // Save the image.
        encoder.save()
    }

    /// render_pixel_aa renders the given pixel with anti-aliasing.
    fn render_pixel_aa(&self, i: f32, j: f32) -> Colour {
        return Colour::new(i, j, 0.25);
    }
}
