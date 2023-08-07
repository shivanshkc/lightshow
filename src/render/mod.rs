mod encode;

// TODO: What's the difference between "use crate" and "use"?
use crate::{camera::Camera, colour::Colour, ray::Ray};
use encode::Encoder;
use image::ImageError;
use rand::{rngs::ThreadRng, thread_rng, Rng};

/// Renderer uses raytracing to render images.
pub struct Renderer<'a> {
    pub opts: Options<'a>,
}

/// Options to create a new renderer.
pub struct Options<'a> {
    /// camera acts as the source of light rays.
    pub camera: Camera,

    // Image dimensions.
    pub image_width: u32,
    pub image_height: u32,

    /// samples_per_pixel for anti-aliasing.
    pub samples_per_pixel: u32,
    // max_diff_depth for nested reflections, refractions and diffusion.
    pub max_diff_depth: u32,

    // output_file is the path to the output file.
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
                // Reversing "j" because the encoder starts drawing from top-left.
                let j_rev = self.opts.image_height - 1 - j;
                // The rendering part.
                let colour = self.render_pixel_aa(i as f32, j as f32, &mut thread_rng());
                // Write the pixel to the image.
                encoder.put_pixel(i, j_rev, colour);
            }
        }

        // Save the image.
        encoder.save()
    }

    /// render_pixel_aa renders the given pixel with anti-aliasing.
    fn render_pixel_aa(&self, i: f32, j: f32, rng: &mut ThreadRng) -> Colour {
        let mut colour = Colour::new(0.0, 0.0, 0.0);
        // Process the configured number of samples for every pixel.
        for _ in 0..self.opts.samples_per_pixel {
            let (u, v) = (i + rng.gen::<f32>(), j + rng.gen::<f32>());
            colour = colour + self.render_pixel(u, v, rng);
        }
        // Take the average of the colour and do gamma correction.
        colour = colour / self.opts.samples_per_pixel as f32;
        Colour::new(colour.r().sqrt(), colour.g().sqrt(), colour.b().sqrt())
    }

    /// render_pixel_aa renders the given pixel (without anti-aliasing).
    fn render_pixel(&self, i: f32, j: f32, rng: &mut ThreadRng) -> Colour {
        // Bring x and y in the [0, 1) interval.
        let x = i / (self.opts.image_width as f32 - 1.0);
        let y = j / (self.opts.image_height as f32 - 1.0);

        // Create a ray and trace it to determine the final pixel colour.
        self.trace_ray(
            self.opts.camera.cast_ray(x, y, rng),
            self.opts.max_diff_depth,
        )
    }

    // trace_ray traces the provided ray upto the given diffusion depth and returns its final colour.
    fn trace_ray(&self, ray: Ray, diff_depth: u32) -> Colour {
        // If diffusion depth is reached, the ray is considered dead.
        // So, the colour is black.
        if diff_depth < 1 {
            return Colour::new(0.0, 0.0, 0.0);
        }

        // Background colour or sky colour.
        let t = 0.5 * (ray.dir.y() + 1.0);
        Colour::new(1.0, 1.0, 1.0) * (1.0 - t) + Colour::new(0.5, 0.75, 1.0) * t
    }
}
