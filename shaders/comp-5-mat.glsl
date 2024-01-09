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
