// is_within checks if the the given value lies within the given range.
bool is_within(float value, vec2 range) {
    return value > range[0] && value < range[1];
}

// vec3_reflect reflects the given incident vector against the given normal.
vec3 vec3_reflect(in vec3 incident, in vec3 normal) {
    return incident - 2 * dot(incident, normal)*normal;
}