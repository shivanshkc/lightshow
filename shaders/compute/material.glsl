// Material type enums.
const uint MATERIAL_METAL = 0;
const uint MATERIAL_LAMBR = 1;
const uint MATERIAL_GLASS = 2;

// Material is a single type that holds all properties for all kinds of materials.
// The properties to use must be decided by checking the mat_type uint.
struct Material {
    // type of the material.
    uint mat_type;

    // metal specific attr ###############
    vec3 metal_attn;
    float metal_fuzz;

    // lambr specific attr ###############
    vec3 lambr_color;

    // glass specific attr ###############
    float glass_refractive_idx;
};

// new_empty_mat returns an empty instance of the Material.
Material new_empty_mat() {
    return Material(0, vec3(0), 0, vec3(0), 0);
}

Material new_metal_mat(vec3 attn, float fuzz) {
    Material mat = new_empty_mat();

    mat.mat_type = MATERIAL_METAL;
    mat.metal_attn = attn;
    mat.metal_fuzz = fuzz;
    return mat;
}

Material new_lambr_mat(vec3 color) {
    Material mat = new_empty_mat();

    mat.mat_type = MATERIAL_LAMBR;
    mat.lambr_color = color;
    return mat;
}

Material new_glass_mat(float ref_idx) {
    Material mat = new_empty_mat();

    mat.mat_type = MATERIAL_GLASS;
    mat.glass_refractive_idx = ref_idx;
    return mat;
}

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

    // Material info.
    Material mat;
};

// new_empty_hit_info returns an empty instance of the HitInfo.
HitInfo new_empty_hit_info() {
    return HitInfo(false, 0, vec3(0), vec3(0), false, new_empty_mat());
}

// hit_info_set_normal sets the normal information in an HitInfo object and returns it.
HitInfo hit_info_set_normal(HitInfo info, Ray r, vec3 outward_normal) {
    info.is_normal_outward = dot(r.dir, outward_normal) < 0;
    info.normal = info.is_normal_outward ? outward_normal : -outward_normal;
    return info;
}

bool mat_scatter(in Material mat, in Ray ray, in HitInfo info, out Ray scattered, out vec3 attn) {
    switch (mat.mat_type) {

    case MATERIAL_METAL:
        // Specular reflection.
        vec3 reflected = reflect(ray.dir, info.normal);
        // Calculate scattered ray direction with fuzz effect.
        vec3 scatt_dir = normalize(reflected + mat.metal_fuzz*randv3_unit());
        // Set the new scattered ray.
        scattered = Ray(info.point, scatt_dir);
        attn = mat.metal_attn;
        return dot(scatt_dir, info.normal) > 0;

    case MATERIAL_LAMBR:
        vec3 scatter_dir = info.normal + randv3_unit();
        // Catch degenerate scatter direction.
        if (length(scatter_dir) < 1e-8) {
            scatter_dir = info.normal;
        }
        // Set the new scattered ray.
        scattered = Ray(info.point, normalize(scatter_dir));
        attn = mat.lambr_color;
        return true;

    case MATERIAL_GLASS:
        // No color in glass.
        // attn = vec3(0.8, 0.95, 0.7);
        attn = vec3(1);

        // Decide on the refraction ratio, based on the normal direction.
        float ref_ratio = info.is_normal_outward ?
            (1.0 / mat.glass_refractive_idx) :
            mat.glass_refractive_idx;

        float cos_theta = min(dot(-ray.dir, info.normal), 1.0);
        float sin_theta = sqrt(1.0 - cos_theta*cos_theta);

        // Calculate the refracted ray.
        bool cannot_refract = ref_ratio * sin_theta > 1.0;
        vec3 direction;
        if (cannot_refract || reflectance(cos_theta, ref_ratio) > randf())
            direction = reflect(ray.dir, info.normal);
        else
            direction = refract(ray.dir, info.normal, ref_ratio);

        // Set the new scattered ray.
        scattered = Ray(info.point, normalize(direction));
        return true;
    }
}
