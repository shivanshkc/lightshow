#version 450

// The fragment color.
out vec4 color;
// Screen size, required for ray tracing calculations.
uniform vec2 screenSize;

void main() {
    float pixelX = gl_FragCoord.x;
    float pixelY = gl_FragCoord.y;
    
    color = vec4(pixelX/screenSize[0], pixelY/screenSize[1], 0.0, 1.0);
}
