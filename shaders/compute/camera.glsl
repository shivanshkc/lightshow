// ray_point_at returns the point the ray will reach after travelling the given distance.
vec3 ray_point_at(Ray r, float d) {
    return r.origin + r.dir * d;
}

// camera is an abstraction that allows different viewing configurations.
struct Camera {
    vec3 origin, lower_left, horizontal, vertical;
};

// new_camera is a constructor function for camera.
Camera new_camera(image2D imgOutput) {
    float focal_length = 1;
    vec2 resolution = imageSize(imgOutput);
    float aspect_ratio = (resolution.x / resolution.y);
    // I still don't understand why exactly we need this "viewport".
    float vp_height = 2;
    float vp_width = vp_height * aspect_ratio;

    // Calculate camera parameters.
    vec3 origin = vec3(0, 0, 0);
    vec3 horizontal = vec3(vp_width, 0, 0);
    vec3 vertical = vec3(0, vp_height, 0);
    vec3 lower_left = origin - vec3(0, 0, focal_length) - horizontal/2 - vertical/2;

    // Instantiate the camera.
    return Camera(origin, lower_left, horizontal, vertical);
}

// camera_cast_ray casts a new ray using the given camera and pixel coordinate.
Ray camera_cast_ray(Camera cam, vec2 uv) {
    vec3 ray_dir = cam.lower_left +
        uv.x * cam.horizontal +
        uv.y * cam.vertical - cam.origin;

    return Ray(cam.origin, ray_dir);
}
