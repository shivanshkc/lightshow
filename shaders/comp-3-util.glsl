// is_within checks if the the given value lies within the given range.
bool is_within(float value, vec2 range) {
    return value > range[0] && value < range[1];
}
