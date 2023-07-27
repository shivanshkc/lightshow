mod vec3;
mod colour;
mod render;

use render::{Renderer, Options};

fn main() {
    let opts = Options{
        image_height: 720,
        image_width: 1280,
    };
    
    Renderer::new(opts).render();
}
