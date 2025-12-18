# `@renderer`

## Purpose

The renderer is the WebGPU backend that draws the scene:
- progressive raytracing (accumulation)
- gizmo overlay rendering
- reacts to kernel events (`state.changed`, `render.invalidated`)

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


