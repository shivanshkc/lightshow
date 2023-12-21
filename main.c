#include<stdio.h>

int main() {
    int image_width = 256;
    int image_height = 256;

    printf("P3\n");
    printf("%d %d\n", image_width, image_height);
    printf("255\n");

    for (int j = 0; j < image_height; ++j) {
        for (int i = 0; i < image_width; ++i) {
            double r = (double) i / (image_width-1);
            double g = (double) j / (image_height-1);
            double b = 0;

            int ir = 255.999 * r;
            int ig = 255.999 * g;
            int ib = 255.999 * b;

            printf("%d %d %d\n", ir, ig, ib);
        }
    }
}