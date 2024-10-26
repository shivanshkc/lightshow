layout (local_size_x = 16, local_size_y = 16) in;

// The texture to store the output.
layout (rgba32f, binding = 0) uniform image2D imgOutput;

// Positions of the bodies.
layout (binding = 1) buffer Inputs {
    vec4 positions[];
};

// The starting seed taken as input.
uniform float init_seed;
uniform int frame_count;

// Configurations.
#define INFINITY 1./0.
#define BOUNCE_LIMIT 30
