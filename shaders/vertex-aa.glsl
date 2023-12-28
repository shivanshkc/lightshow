#version 450
layout (location = 0) in vec2 position;
layout (location = 1) in vec2 tex_coords;

out vec2 TexCoords;

void main() {
    TexCoords = tex_coords;
    gl_Position = vec4(position, 0.0, 1.0);
}
