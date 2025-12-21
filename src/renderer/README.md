# `@renderer`

## Purpose

The renderer is the WebGPU backend that draws the scene:
- progressive raytracing (accumulation)
- gizmo overlay rendering
- reacts to kernel events (`state.changed`, `render.invalidated`)

## Mesh ray tracing rollout (notes)

This module is in the middle of migrating from analytic primitive intersections (sphere/box) to mesh-based ray tracing.

As of the current rollout stage:
- The raytracer still traces the active scene via the existing analytic `sceneHeader/sceneObjects` path.
- Additional **mesh library buffers** (vertices/indices/BLAS/instances) may be bound for plumbing and future steps, but are not necessarily used by `traceScene` yet.

## Public API

- `Renderer` (main loop): `src/renderer/Renderer.ts`
- Pipelines: `RaytracingPipeline`, `BlitPipeline`
- WebGPU initialization: `initWebGPU` in `src/renderer/webgpu.ts`

Entry point:
- `src/renderer/index.ts`

## Inputs (dependency injection)

Renderer does not read stores directly. It receives `RendererDeps`:
- `queries`: `KernelQueries`
- `events`: `KernelEvents`
- `getCameraState()`, `getGizmoState()`

See wiring:
- `src/adapters/zustand/createRendererDepsFromStores.ts`
- `src/components/Canvas.tsx`

## Testing

- Unit tests:
  - `src/__tests__/Renderer.test.ts`
  - `src/__tests__/RaytracingPipeline.test.ts`

Run:

```bash
npm test -- --run
```


