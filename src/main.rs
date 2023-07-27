mod colour;
mod render;
mod vec3;

use render::{Options, Renderer};

fn main() {
    let opts = Options {
        image_height: 720,
        image_width: 1280,
        output_file: "./dist/image.ppm",
    };

    Renderer::new(opts).render().unwrap();
}
