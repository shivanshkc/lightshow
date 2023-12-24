#version 450

// The output pixel color.
out vec4 color;
// Screen resolution, required for ray tracing calculations.
uniform vec2 resolution;

// ################################################################################################

// ray that will be traced.
struct Ray {
    vec3 origin, dir;
};

// ray_point_at returns the point the ray will reach after travelling the given distance.
vec3 ray_point_at(Ray r, float d) {
    return r.origin + r.dir * d;
}

// ################################################################################################

// camera is an abstraction that allows different viewing configurations.
struct Camera {
    vec3 origin, lower_left, horizontal, vertical;
};

// new_camera is a constructor function for camera.
Camera new_camera() {
    float focal_length = 1;
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

    return Ray(cam.origin, normalize(ray_dir));
}

// ################################################################################################

// Sphere represents the primitive sphere geometry.
struct Sphere {
    vec3 center;
    float radius;
};

// HitInfo holds the information about a ray hit.
struct HitInfo {
    bool is_hit;
    float dist;
};

// sphere_hit is the intersection function for the Sphere type.
HitInfo sphere_hit(Sphere s, Ray r) {
    vec3 o2c = r.origin - s.center;

    // Components of the quadratic equation.
    float a = dot(r.dir, r.dir);
    float b = 2 * dot(o2c, r.dir);
    float c = dot(o2c, o2c) - s.radius * s.radius;

    // Discriminant will tell if a hit occurs or not.
    float discriminant = b*b - 4*a*c;
    if (discriminant < 0) {
        return HitInfo(false, 0);
    }

    // Calculate distance from the hitpoint.
    float dist = (-b - sqrt(discriminant)) / (2 * a);
    return HitInfo(true, dist);
}

// ################################################################################################

// determine_ray_color determines the color of the given ray.
// This is where the actual ray tracing begins.
vec3 determine_ray_color(Ray r) {
    // Check if an object is hit.
    Sphere s = Sphere(vec3(0, 0, -1), 0.5);
    HitInfo info = sphere_hit(s, r);
    if (info.is_hit) {
        vec3 normal = normalize(ray_point_at(r, info.dist) - s.center);
        return 0.5 * (normal + 1);
    }

    // Render background.
    vec3 unit_dir = normalize(r.dir);
    float t = 0.5 * (unit_dir.y + 1.0);
    return (1.0 - t) * vec3(1.0) + t * vec3(0.5, 0.7, 1.0);
}

void main() {
    // Pixel coordinates.
    vec2 uv = gl_FragCoord.xy / resolution;

    // Create ray.
    Ray ray = camera_cast_ray(new_camera(), uv);
    // Determine the color by tracing the ray.
    vec3 col = determine_ray_color(ray);

    // Assign color.
    color = vec4(col, 1);
}

// ################################################################################################