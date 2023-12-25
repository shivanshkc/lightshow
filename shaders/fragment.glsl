#version 450

// The output pixel color.
out vec4 color;
// Screen resolution, required for ray tracing calculations.
uniform vec2 resolution;

// Configurations.
#define INFINITY 1./0.
#define BOUNCE_LIMIT 10

// ################################################################################################
// This random number implementation is taken from:
// https://github.com/sp4ghet/raytracing_in_one_weekend/blob/master/ch08_diffuse.frag

// Constants required to ray-tracing.
#define PI 3.1415926535897932385
#define TAU 2. * PI
#define PHI 1.61803398874989484820459

// rand_seed is the seed for generating random numbers.
float rand_seed = 0.25;

// randf returns a random float in [0, 1)
// st should always be the gl_FragCoord.xy value.
float randf(vec2 st) {
    return fract(tan(distance(st*PHI, st)*rand_seed)*st.x);
}

// randv2 returns a random vec2.
vec2 randv2() {
    return vec2(
        randf(vec2(rand_seed-1.23, (rand_seed+3.1)* 3.2)),
        randf(vec2(rand_seed+12.678, rand_seed - 5.8324))
    );
}

// randv3 returns a random vec3.
vec3 randv3() {
    return vec3(
        randf(vec2(rand_seed-0.678, rand_seed-0.123)),
        randf(vec2(rand_seed-0.3, rand_seed+0.56)),
        randf(vec2(rand_seed+0.1234, rand_seed-0.523))
    );
}

// randv3_in_unit_sphere returns a random vec3 in a unit sphere.
vec3 randv3_in_unit_sphere() {
    vec2 tp = randv2();
    float theta = tp.x * TAU;
    float phi = tp.y * TAU;
    vec3 p = vec3(sin(theta) * cos(phi), sin(theta)*sin(phi), cos(theta));
    return normalize(p);
}

// randv3_unit returns a random vec3 of magnitude 1.
vec3 randv3_unit(){
    vec2 rand = randv2();
    float a = rand.x * TAU;
    float z = (2. * rand.y) - 1.;
    float r = sqrt(1. - z*z);
    return vec3(r*cos(a), r*sin(a), z);
}

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

// HitInfo holds the information about a ray hit.
struct HitInfo {
    // Flag to see if hit occurred.
    bool is_hit;

    // Info about point of hit.
    float dist;
    vec3 point;

    // Info about the hit point normal.
    vec3 normal;
    bool is_normal_outward;
};

// new_empty_hit_info returns an empty instance of the HitInfo.
HitInfo new_empty_hit_info() {
    return HitInfo(false, 0, vec3(0), vec3(0), false);
}

// hit_info_set_normal sets the normal information in an HitInfo object and returns it.
HitInfo hit_info_set_normal(HitInfo info, Ray r, vec3 outward_normal) {
    info.is_normal_outward = dot(r.dir, outward_normal) < 0;
    info.normal = info.is_normal_outward ? outward_normal : -outward_normal;
    return info;
}

// Sphere represents the primitive sphere geometry.
struct Sphere {
    vec3 center;
    float radius;
};

// is_within checks if the the given value lies within the given range.
bool is_within(float value, vec2 range) {
    return value > range[0] && value < range[1];
}

// sphere_hit is the intersection function for the Sphere type.
HitInfo sphere_hit(Sphere s, Ray r, vec2 range) {
    vec3 o2c = r.origin - s.center;

    // Components of the quadratic equation.
    float a = dot(r.dir, r.dir);
    float b = 2 * dot(o2c, r.dir);
    float c = dot(o2c, o2c) - s.radius * s.radius;

    // Discriminant will tell if a hit occurs or not.
    float discriminant = b*b - 4*a*c;
    if (discriminant < 0) {
        return new_empty_hit_info();
    }

    // Get the closest root that's within the range.
    float disc_sqrt = sqrt(discriminant);
    float root = (-b - disc_sqrt) / (2 * a);
    if (!is_within(root, range)) {
        root = (-b + disc_sqrt) / (2 * a);
        if (!is_within(root, range)) {
            return new_empty_hit_info();
        }
    }

    // Prepare and return the hit info.
    HitInfo info;
    info.is_hit = true;
    info.dist = root;
    info.point = ray_point_at(r, root);

    vec3 outward_normal = (info.point - s.center) / s.radius;
    info = hit_info_set_normal(info, r, outward_normal);
    return info;
}

// ################################################################################################

// List of all spheres.
Sphere spheres[] = Sphere[](
    Sphere(vec3(0, 0, -1), 0.5),
    Sphere(vec3(0, -1000.5, -1), 1000)
);

// get_closest_hit returns the hit-info of the closest point of hit out of all the given objects.
HitInfo get_closest_hit(Ray r) {
    float closest_so_far = INFINITY;
    HitInfo closest_hi = new_empty_hit_info();
    bool hit_anything = false;

    // Get the closest hit object.
    for (int i = 0; i < spheres.length(); i++) {
        // Check hit.
        HitInfo info = sphere_hit(spheres[i], r, vec2(0.01, closest_so_far));
        if (!info.is_hit) {
            continue;
        }

        hit_anything = true;
        // Collect the closest sphere.
        closest_so_far = info.dist;
        closest_hi = info;
    }

    return closest_hi;
}

// get_bg_color returns the background color for the given ray.
vec3 get_bg_color(Ray r) {
    vec3 unit_dir = normalize(r.dir);
    float t = 0.5 * (unit_dir.y + 1.0);
    return (1.0 - t) * vec3(1.0) + t * vec3(0.5, 0.7, 1.0);
}

// get_ray_color determines the color of the given ray.
// This is where the actual ray tracing begins.
vec3 get_ray_color(Ray r) {
    vec3 attenuation = vec3(1.0, 1.0, 1.0);

    for (int i = 0; i < BOUNCE_LIMIT; ++i) {
        HitInfo info = get_closest_hit(r);
        if (!info.is_hit) {
            // Background color if no hit.r.dir
            return get_bg_color(r) * attenuation;
        }

        vec3 target = info.normal + randv3_unit();
        r = Ray(info.point, normalize(target));
        attenuation *= 0.5;
    }

    // If the maximum depth is reached, return black
    return vec3(0.0, 0.0, 0.0);
}

void main() {
    // Pixel coordinates.
    vec2 uv = gl_FragCoord.xy / resolution;
    // Initialize the seed.
    rand_seed = randf(gl_FragCoord.xy);

    // Create ray.
    Ray ray = camera_cast_ray(new_camera(), uv);
    // Determine the color by tracing the ray.
    vec3 col = get_ray_color(ray);
    // Gamma correction.
    col = sqrt(col);

    // Assign color.
    color = vec4(col, 1);
    // color = vec4(randv3_unit(), 1);
}

// ################################################################################################