#version 460

in vec2 vertex;
in vec2 texCoord;

out vec2 TexCoord;

void main() {
    gl_Position = vec4(vertex, 0.0, 1.0);
    TexCoord = texCoord;
}
