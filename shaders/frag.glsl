#version 460

in vec2 TexCoord;

out vec4 FragColor;

uniform sampler2D fullTexture;

void main() {
    FragColor = texture(fullTexture, TexCoord);
}
