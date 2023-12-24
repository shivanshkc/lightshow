#version 450

// The output pixel color.
out vec4 color;
// Screen resolution, required for ray tracing calculations.
uniform vec2 resolution;

// ray that will be traced.
struct ray {
    vec3 origin, dir;
};

// ray_point_at returns the point the ray will reach after travelling the given distance.
vec3 ray_point_at(ray r, float d) {
    return r.origin + r.dir * d;
}

// camera is an abstraction that allows different viewing configurations.
struct camera {
    vec3 origin, lower_left, horizontal, vertical;
};

// new_camera is a constructor function for camera.
camera new_camera() {
    float aspect_ratio = (resolution.x / resolution.y);
    // I still don't understand why exactly we need this "viewport".
    float vp_height = 2;
    float vp_width = vp_height * aspect_ratio;

    // Calculate camera parameters.
    vec3 origin = vec3(0, 0, 0);
    vec3 horizontal = vec3(4, 0, 0);
    vec3 vertical = vec3(0, 4 / aspect_ratio, 0);
    vec3 lower_left = vec3(-2, -1, -1);
    
    // Instantiate the camera.
    return camera(origin, lower_left, horizontal, vertical);
}

// camera_cast_ray casts a new ray using the given camera and pixel coordinate.
ray camera_cast_ray(camera cam, vec2 uv) {
    vec3 ray_dir = cam.lower_left +
        uv.x * cam.horizontal +
        uv.y * cam.vertical - cam.origin;

    return ray(cam.origin, normalize(ray_dir));
}

// determine_ray_color determines the color of the given ray.
// This is where the actual ray tracing begins.
vec3 determine_ray_color(ray r) {
    vec3 unit_dir = normalize(r.dir);
    float t = 0.5 * (unit_dir.y + 1.0);
    return (1.0 - t) * vec3(1.0) + t * vec3(0.5, 0.7, 1.0);
}

void main() {
    // Pixel coordinates.
    vec2 uv = gl_FragCoord.xy / resolution;

    // Create ray.
    ray r = camera_cast_ray(new_camera(), uv);
    // Determine the color by tracing the ray.
    vec3 col = determine_ray_color(r);

    // Assign color.
    color = vec4(col, 1);
}