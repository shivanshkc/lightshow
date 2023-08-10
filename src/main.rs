mod camera;
mod colour;
mod materials;
mod objects;
mod random;
mod ray;
mod render;
mod vec3;

const ASPECT_RATIO: f32 = 16.0 / 9.0;
const IMAGE_HEIGHT: u32 = 720;

fn main() {
    // Create camera options.
    let cam_opts = camera::Options {
        look_from: vec3::Vec3::new(0., 0., 0.),
        look_at: vec3::Vec3::new(0., 0., -1.),
        up: vec3::Vec3::new(0., 1., 0.),
        aspect_ratio: ASPECT_RATIO,
        fov_vertical: 90.0,
        aperture: 0.1,
        focus_distance: 1.0,
    };

    // Create render options.
    let opts = render::Options {
        camera: camera::Camera::new(&cam_opts),
        image_height: IMAGE_HEIGHT,
        image_width: (IMAGE_HEIGHT as f32 * ASPECT_RATIO) as u32,
        samples_per_pixel: 1,
        max_diff_depth: 50,
        output_file: "./dist/image.jpg",
    };

    // Render.
    render::Renderer::new(opts).render().unwrap();
}
