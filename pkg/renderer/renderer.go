package renderer

import (
	"fmt"
	"math"
	"raytracing/pkg/camera"
	"raytracing/pkg/shapes"
	"raytracing/pkg/utils"
)

// Type alias for shape.
type shape = shapes.Shape

// Renderer uses raytracing to render images.
type Renderer struct {
	opts *Options
}

// Options to create a new renderer.
type Options struct {
	// Camera acts as the source for all rays.
	Camera *camera.Camera

	ImageWidth  float64
	ImageHeight float64

	// SkyColour is the colour of the sky (or background).
	SkyColour *utils.Colour

	// MaxDiffusionDepth is the maximum number of times that a ray is allowed to
	// diffuse (reflect or refract) before it is considered "dead".
	//
	// In simpler words, it produces the "infinity mirror"
	MaxDiffusionDepth int
	// SamplesPerPixel for anti-aliasing.
	SamplesPerPixel int
	// ProgressLogger logs the progress of the rendering.
	ProgressLogger func(string)
}

// New returns a new Renderer for the given options.
func New(opts *Options) *Renderer {
	return &Renderer{opts: opts}
}

// Render starts the raytracing to render the world.
func (r *Renderer) Render(world shape) {
	// PPM file headers.
	fmt.Printf("P3\n")
	fmt.Printf("%d %d\n", int(r.opts.ImageWidth), int(r.opts.ImageHeight))
	fmt.Printf("255\n")

	// Two nested loops for traversing every pixel on the screen.
	for j := r.opts.ImageHeight - 1; j >= 0; j-- {
		// Progress tracker.
		go r.opts.ProgressLogger(fmt.Sprintf("Lines remaining: %d", int(j)))

		for i := 0.0; i < r.opts.ImageWidth; i++ {
			colour := r.renderPixelWithAA(i, j, world)
			fmt.Println(colour.ToPPM())
		}
	}
}

// renderPixelWithAA is called for every pixel on the screen.
// Its job is to determine the colour of the given pixel with anti-aliasing.
func (r *Renderer) renderPixelWithAA(x, y float64, world shape) *utils.Colour {
	colour := utils.NewColour(0, 0, 0)

	for s := 0; s < r.opts.SamplesPerPixel; s++ {
		x = (x + utils.Random.Float()) / r.opts.ImageWidth
		y = (y + utils.Random.Float()) / r.opts.ImageHeight

		pixelCol := r.renderPixel(x, y, world)
		colour = colour.Add(pixelCol)
	}

	return colour
}

// renderPixel is called for every pixel on the screen.
// Its job is to determine the colour of the given pixel (without anti-aliasing).
func (r *Renderer) renderPixel(x, y float64, world shape) *utils.Colour {
	// Create a ray and trace it to determine the final pixel colour.
	return r.traceRay(r.opts.Camera.CastRay(x, y), world, r.opts.MaxDiffusionDepth)
}

// traceRay traces the provided ray upto the given diffusion depth and returns its final colour.
func (r *Renderer) traceRay(ray *utils.Ray, world shape, diffusionDepth int) *utils.Colour {
	// If diffusion depth is reached, the ray is considered dead.
	// So, the colour is black.
	if diffusionDepth < 1 {
		return utils.NewColour(0, 0, 0)
	}

	// Hit the world. B-)
	if hitInfo, isHit := world.Hit(ray, 0.01, math.MaxFloat64); isHit {
		// Scatter the ray using the material of the shape.
		scat, atten, isScat := hitInfo.Mat.Scatter(ray, hitInfo)
		// Return black if the ray got absorbed.
		if !isScat {
			return utils.NewColour(0, 0, 0)
		}

		// Calculate the colour of the scattered ray.
		// This is where nested reflections/refractions of the ray are considered.
		scatRayColour := r.traceRay(scat, world, diffusionDepth-1)
		// Add the attenuation to the colour.
		return scatRayColour.Add(atten)
	}

	// Background.
	// The {0.5 + (x + 1)} formula converts the [-1, 1] interval to [0, 1]
	bgColourIntensity := 0.5 * (ray.Dir.Y + 1)
	// Background colour using a gradient.
	return utils.NewColour(1, 1, 1).Lerp(r.opts.SkyColour, bgColourIntensity)
}
