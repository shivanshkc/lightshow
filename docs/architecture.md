# Architecture (v2 in-progress)

This document is a **navigation map** for the codebase as it is migrated to v2.

v2 goal: **behavior-preserving refactor** that improves decoupling, mockability, and startup-time swappability (see `prp/v2/base.md`).

## Module map (current)

> This list will evolve as v2 milestones introduce new module boundaries.

- `@ports`
  - v2 **contracts**: `Command` (writes), `KernelQueries` (reads), `KernelEvents` (notifications).
- `@kernel`
  - v2 **state authority**: owns history stacks + grouping and emits kernel events.
- `@adapters`
  - Concrete adapters that bridge ports to specific technologies (React, DOM input, Zustand v1 stores, renderer wiring).
- `@core`
  - Math, types, camera math/controller, raycasting, and GPU scene buffer utilities.
- `@renderer`
  - WebGPU renderer and pipelines.
- `@store`
  - Legacy Zustand stores (v1). In v2, these are only accessed through `@adapters` (temporary while migration completes).
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
  - Relative imports within a module are allowed (migration-friendly), but cross-module relative imports should be retired over time.
- **Directionality**:
  - `@ports` is dependency-free.
  - `@kernel` depends on `@ports` (not React/WebGPU/Zustand/UI).
  - `@renderer` consumes `@ports` contracts via injected deps; it does not import stores directly.
  - `@components` dispatch commands + read queries; store singletons must be behind adapters.

## “Where to find X” (starter)

- **Rendering loop**: `src/renderer/Renderer.ts`
- **Raytracing pipeline**: `src/renderer/RaytracingPipeline.ts`
- **Picking/raycasting**: `src/core/Raycaster.ts`
- **Kernel shell / event ordering**: `src/kernel/Kernel.ts`
- **Commands (writes)**: `src/ports/commands.ts`
- **Queries (reads)**: `src/ports/queries.ts`
- **Events (notifications)**: `src/ports/events.ts`
- **Scene backing store adapter**: `src/adapters/zustand/ZustandSceneBackingStore.ts`
- **Renderer deps adapter**: `src/adapters/zustand/createRendererDepsFromStores.ts`
- **Canvas deps adapter**: `src/adapters/zustand/createCanvasDepsFromStores.ts`
- **Camera orbit/pan/zoom state (legacy)**: `src/store/cameraStore.ts`
- **Canvas input wiring**: `src/components/Canvas.tsx` (dispatches commands; store reads via v1 adapter)
- **Benchmark harness**: `bench/run.mjs` + `src/bench/benchBridge.ts`


