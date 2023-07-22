# Lightshow

Lightshow is a raytracer written purely in Go.

![Render](https://github.com/shivanshkc/lightshow/blob/main/showcase/image.jpg)

## Quickstart

To render a scene using the default settings, go ahead and execute:

```bash
make
```

You will need to have Go installed for this to work.

## Details

The rendering process is triggered by calling the `Render` method, which is available on the `Renderer` type. You can find the `Renderer` struct in the `pkg/renderer` package.

The call would look something like this:

```go
var renderOptions = ... // TODO
var world = ... // TODO

// Start rendering.
if err := renderer.New(renderOptions).Render(world); err != nil {
    panic(fmt.Errorf("failed to render: %w", err))
}
```

Now, let's focus on the `renderOptions` and `world` values.

### RenderOptions

Quickstart value:

```go
const (
	// aspectRatio of the rendered image.
	aspectRatio = 16.0 / 9.0
	imageHeight = 720
)

var cameraOptions = &camera.Options{
	LookFrom:            utils.NewVec3(13, 2, 3),
	LookAt:              utils.NewVec3(0, 0, 0),
	Up:                  utils.NewVec3(0, 1, 0),
	AspectRatio:         aspectRatio,
	FieldOfViewVertical: 20,
	Aperture:            0.1,
	FocusDistance:       10,
}

var renderOptions = &renderer.Options{
	Camera:            camera.New(cameraOptions),
	ImageWidth:        imageHeight * aspectRatio,
	ImageHeight:       imageHeight,
	SkyColour:         utils.NewColour(0.5, 0.75, 1.0),
	MaxDiffusionDepth: 50,
	SamplesPerPixel:   50,
	MaxWorkers:        400,
	OutputFile:        "./dist/image.jpg",
}
```

As you can see, `RenderOptions` requires `CameraOptions` so we defined it first.

All the fields in these options are documented in the code. Find `CameraOptions` definition in the `pkg/camera` package and that of `RenderOptions` in the `pkg/renderer` package.

### World

World is a simple slice of shapes that will be rendered.

Quickstart value:

```go
var world = shapes.NewGroup(
	// Ground.
	&shapes.Sphere{
		Center: utils.NewVec3(0, -100000, 0),
		Radius: 100000,
		Mat:    mats.NewMatte(utils.NewColour(0.5, 0.5, 1)),
	},
	// Middle glass sphere.
	&shapes.Sphere{
		Center: utils.NewVec3(0, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewGlass(1.5),
	},
	// Front metallic sphere.
	&shapes.Sphere{
		Center: utils.NewVec3(4, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewMetallic(utils.NewColour(0.7, 0.6, 0.5), 0),
	},
	// Back matte sphere.
	&shapes.Sphere{
		Center: utils.NewVec3(-4, 1, 0),
		Radius: 1.0,
		Mat:    mats.NewMatte(utils.NewColour(0.4, 0.2, 0.1)),
	},
)
```

With these values defined, the `Render` method can now be called. It will take some time to render based on the number of shapes and other graphical properties.

## References

- [_Ray Tracing in One Weekend_](https://raytracing.github.io/books/RayTracingInOneWeekend.html)