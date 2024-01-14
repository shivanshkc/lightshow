// lightshow:import shaders/compute/inputs.glsl
// lightshow:import shaders/compute/random.glsl
// lightshow:import shaders/compute/utils.glsl
// lightshow:import shaders/compute/camera.glsl
// lightshow:import shaders/compute/material.glsl
// lightshow:import shaders/compute/sphere.glsl

// List of all spheres.
Sphere spheres[] = Sphere[](
    // Sun
    Sphere(vec3(0), 0, new_metal_mat(vec3(0.7, 0.3, 0.3), 0.0)),
    // Hollow 1
    Sphere(vec3(0), 0, new_glass_mat(1.5)),
    Sphere(vec3(0), 0, new_glass_mat(1.5)),
    // Hollow 2
    Sphere(vec3(0), 0, new_glass_mat(1.5)),
    Sphere(vec3(0), 0, new_glass_mat(1.5)),
    // Ground
    Sphere(vec3(0), 0, new_lambr_mat(vec3(0.5, 0.5, 0.5)))
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

        // Scatter the ray as per the material.
        Ray scatt;
        vec3 attn;
        if (!mat_scatter(info.mat, r, info, scatt, attn)) {
            return vec3(0.0, 0.0, 0.0);
        }

        // Update params for next iteration.
        attenuation *= attn;
        r = scatt;
    }

    // If the maximum depth is reached, return black
    return vec3(0.0, 0.0, 0.0);
}

void main() {
    // Obtain normalized pixel values.
    ivec2 pixelCoords = ivec2(gl_GlobalInvocationID.xy);
    float pX = float(pixelCoords.x) / float(imageSize(imgOutput).x);
    float pY = float(pixelCoords.y) / float(imageSize(imgOutput).y);

     // Initialize the seed.
    rand_seed = uint(init_seed * (pow(pixelCoords.x, 2) + pow(pixelCoords.y, 3)));

    // Move bodies to the given positions.
    for (int i = 0; i < spheres.length(); i++) {
        spheres[i].center = positions[i].xyz;
        spheres[i].radius = positions[i].w;
    }

    // Create ray.
    Ray r = camera_cast_ray(new_camera(), vec2(pX, pY));
    // Determine the color by tracing the ray.
    vec3 col = get_ray_color(r);
    // Gamma correction.
    col = sqrt(col);

    // Assign color.
    imageStore(imgOutput, pixelCoords, vec4(col, 1));
}
