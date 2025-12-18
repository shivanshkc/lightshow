# Architecture (v2 in-progress)

This document is a **navigation map** for the codebase as it is migrated to v2.

v2 goal: **behavior-preserving refactor** that improves decoupling, mockability, and startup-time swappability (see `prp/v2/base.md`).

## Module map (current)

> This list will evolve as v2 milestones introduce new module boundaries.

- `@core`
  - Math, types, camera math/controller, raycasting, and GPU scene buffer utilities.
- `@renderer`
  - WebGPU renderer and pipelines.
- `@store`
  - Current state management (Zustand) used by the v1 app; will be migrated behind kernel contracts in later milestones.
- `@components`
  - React UI components (panels/layout/canvas).
- `@hooks`
  - React hooks.
- `@gizmos`
  - Gizmo logic/rendering.
- `@bench`
  - Benchmark bridge/utilities (gated via `?__bench=1`).

## Dependency rules (guardrails)

- **No cycles**: enforced via ESLint `import/no-cycle`.
- **Public API only for aliased imports**:
  - Imports like `@core/*` are disallowed.
  - Consumers must import from the module entrypoint `index.ts` (e.g. `import { Camera } from '@core'`).
  - Relative imports within a module are allowed (migration-friendly).

## “Where to find X” (starter)

- **Rendering loop**: `src/renderer/Renderer.ts`
- **Raytracing pipeline**: `src/renderer/RaytracingPipeline.ts`
- **Picking/raycasting**: `src/core/Raycaster.ts`
- **Camera orbit/pan/zoom state**: `src/store/cameraStore.ts` (will migrate later)
- **Canvas input wiring**: `src/components/Canvas.tsx`
- **Benchmark harness**: `bench/run.mjs` + `src/bench/benchBridge.ts`


