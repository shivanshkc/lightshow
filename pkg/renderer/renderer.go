package renderer

import (
	"fmt"
	"image"
	"math"

	"github.com/alitto/pond"

	"github.com/shivanshkc/lightshow/pkg/camera"
	"github.com/shivanshkc/lightshow/pkg/random"
	"github.com/shivanshkc/lightshow/pkg/utils"
)

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
	// In simpler words, it produces the "infinity mirror".
	MaxDiffusionDepth int
	// SamplesPerPixel for anti-aliasing.
	SamplesPerPixel int
	// MaxWorkers is the max number of goroutines to be spawned for rendering.
	MaxWorkers int

	// OutputFile is the path to the output file.
	OutputFile string
}

// New returns a new Renderer for the given options.
func New(opts *Options) *Renderer {
	return &Renderer{opts: opts}
}

func (r *Renderer) Render(world shape) error {
	// Create a pool for concurrent processing.
	pixelCount := r.opts.ImageHeight * r.opts.ImageWidth
	workerPool := pond.New(r.opts.MaxWorkers, int(pixelCount), pond.Strategy(pond.Lazy()))

	// Create a new image.
	img := image.NewRGBA(image.Rectangle{
		image.Point{0, 0},
		image.Point{int(r.opts.ImageWidth), int(r.opts.ImageHeight)},
	})

	// Two nested loops for traversing every pixel on the screen.
	for j := 0.0; j < r.opts.ImageHeight; j++ {
		for i := 0.0; i < r.opts.ImageWidth; i++ {
			// Copy loop variables for safety in goroutines.
			ii, jj, jImg := i, j, r.opts.ImageHeight-j-1
			// Schedule the task.
			workerPool.Submit(func() {
				// Here, we have to use "jImg" instead of "j" because
				// Go's image package treats top-left as the origin,
				// instead of bottom-left.
				colour := r.renderPixelWithAA(ii, jImg, world)
				img.Set(int(ii), int(jj), colour.ToStd())

				// TODO: Log progress without performance impact.
			})
		}
	}

	// Await render completion.
	workerPool.StopAndWait()

	// Encode the image.
	if err := encodeImage(img, r.opts.OutputFile); err != nil {
		return fmt.Errorf("failed to encode image: %w", err)
	}

	return nil
}

// renderPixelWithAA is called for every pixel on the screen.
// Its job is to determine the colour of the given pixel with anti-aliasing.
func (r *Renderer) renderPixelWithAA(x, y float64, world shape) *utils.Colour {
	colour := utils.NewColour(0, 0, 0)

	// Process the configured number of samples for every pixel.
	for s := 0; s < r.opts.SamplesPerPixel; s++ {
		u := x + random.Float()
		v := y + random.Float()

		pixelCol := r.renderPixel(u, v, world)
		colour = colour.Add(pixelCol)
	}

	// Take the average of the colour and do gamma correction.
	spp := float64(r.opts.SamplesPerPixel)
	return utils.NewColour(
		math.Sqrt(colour.R/spp),
		math.Sqrt(colour.G/spp),
		math.Sqrt(colour.B/spp),
	)
}

// renderPixel is called for every pixel on the screen.
// Its job is to determine the colour of the given pixel (without anti-aliasing).
func (r *Renderer) renderPixel(x, y float64, world shape) *utils.Colour {
	// Bring x and y in the [0, 1) interval.
	x /= (r.opts.ImageWidth - 1)
	y /= (r.opts.ImageHeight - 1)

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
	if hitInfo, isHit := world.Hit(ray, 0.001, math.MaxFloat64); isHit {
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
		return utils.NewColour(
			scatRayColour.R*atten.R,
			scatRayColour.G*atten.G,
			scatRayColour.B*atten.B,
		)
	}

	// Background.
	// The {0.5 + (x + 1)} formula converts the [-1, 1] interval to [0, 1]
	bgColourIntensity := 0.5 * (ray.Dir.Y + 1)
	// Background colour using a gradient.
	return utils.NewColour(1, 1, 1).Lerp(r.opts.SkyColour, bgColourIntensity)
}
