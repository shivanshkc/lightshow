// This random number implementation is taken from Sebastian Lague's Ray Tracing repository.

// The seed that's updated after every rand call.
uint rand_seed;

// rand returns a random uint in the range 0 to 2^32.
uint rand() {
    rand_seed = rand_seed * 747796405 + 28913364;
    uint result = ((rand_seed >> ((rand_seed >> 28) + 4)) ^ rand_seed) * 277803737;
    result = (result >> 22) ^ result;
    return result;
}

// randf returns a random float in [0, 1).
float randf() {
    return rand() / 4294967295.0; // 2^32 - 1
}

// randv2 returns a random vec2.
vec2 randv2() {
    return vec2(randf(), randf());
}

// randv3 returns a random vec3.
vec3 randv3() {
    return vec3(randf(), randf(), randf());
}

// randv3_in_unit_sphere returns a random vec3 in a unit sphere.
vec3 randv3_in_unit_sphere() {
    while (true) {
        vec3 p = randv3();
        if (dot(p, p) < 1) return p;
    }
}

// randv3_unit returns a random vec3 of magnitude 1.
vec3 randv3_unit(){
    return normalize(randv3_in_unit_sphere());
}
