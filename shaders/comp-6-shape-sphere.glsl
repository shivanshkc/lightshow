// Sphere represents the primitive sphere geometry.
struct Sphere {
    vec3 center;
    float radius;

    // Material info.
    Material mat;
};

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
    HitInfo info = new_empty_hit_info();
    info.is_hit = true;
    info.dist = root;
    info.point = ray_point_at(r, root);

    // Assign normal info.
    vec3 outward_normal = (info.point - s.center) / s.radius;
    info = hit_info_set_normal(info, r, outward_normal);

    // Assign material info.
    info.mat = s.mat;
    return info;
}
