## Lightshow — Agent Context

### 1) Overview (one paragraph)
Lightshow is a **browser-based WebGPU real-time / progressive raytracing playground** built for experimenting with scenes, materials, and interactive editing (selection + gizmos) in a desktop-like UI. Users open the app in a WebGPU-capable browser, orbit/pan/zoom the camera, select scene objects via click picking, edit transforms/materials via panels and W/E/R gizmos, and the renderer progressively accumulates samples until invalidated by camera/scene changes.

### 2) Tech stack & tooling
- **Language**: TypeScript (`tsconfig.json`, strict, `noEmit`)
- **UI**: React 18 (`src/App.tsx`, `src/components/*`)
- **State**: Zustand (stores in `src/store/*`; accessed externally via adapters)
- **Rendering/graphics**: WebGPU + WGSL shaders
  - WebGPU init: `src/renderer/webgpu.ts`
  - Raytracing shader: `src/renderer/shaders/raytracer.wgsl`
  - Gizmo shader: `src/gizmos/gizmoShader.wgsl`
  - TS types: `@webgpu/types` (see `tsconfig.json`)
- **Build tool**: Vite 5 (`vite.config.ts`)
- **Tests**: Vitest + JSDOM (`package.json`, `vite.config.ts`, tests in `src/__tests__`)
- **Lint**: ESLint 9 flat config (`eslint.config.js`)
  - Enforces **no import cycles** and **module boundary rules** (details below)
- **Styling**: TailwindCSS + PostCSS (`tailwind.config.js`, `postcss.config.js`, `src/index.css`)

### 3) How to run (verified commands)
All commands are in `package.json`:

- **Install**
  - `npm install`
- **Dev server**
  - `npm run dev`
  - Note: port is not pinned in config; rely on Vite’s console output.
- **Build**
  - `npm run build` (runs `tsc` typecheck + `vite build`)
- **Preview built app**
  - `npm run preview`
  - Note: port is not pinned in config; rely on Vite’s console output.
- **Tests**
  - `npm run test`
  - Common CI-style run (no watch): `npm run test -- --run` (also suggested in `README.md`)
  - UI runner: `npm run test:ui`
  - Coverage: `npm run test:coverage`
- **Benchmarks**
  - `npm run bench` (runs `bench/run.mjs`)

**Benchmark prerequisites / env vars** (see `bench/run.mjs`, `benchmarks/README.md`):
- **Requires local Chrome/Chromium** (uses Chrome DevTools Protocol over WebSocket; no Playwright).
- **Optional env**:
  - `CHROME_BIN`: path to Chrome/Chromium binary (required on non-macOS; optional on macOS)
  - `BENCH_RUNS` (default `3`)
  - `BENCH_MAX_ATTEMPTS_PER_RUN` (default `2`)
  - `BENCH_PORT` (default `4173`) — bench forces preview to `127.0.0.1` with `--strictPort`
  - `BENCH_ORBIT_MS` (default `10000`)

### 4) Repository map (where “truth” lives)
- `src/`: **authoritative application source**
  - `src/main.tsx`: app entry; conditionally installs benchmark bridge when `?__bench`
  - `src/App.tsx`: app shell + `KernelProvider` wiring + panels/canvas/status bar
  - `src/components/`: React UI (layout, panels, UI primitives)
  - `src/ports/`: cross-module contracts (commands/queries/events) — dependency-free
  - `src/kernel/`: application core/state authority (dispatch, history, events)
  - `src/adapters/`: bridges ports/kernel to tech (React context, DOM input, Zustand backing store, renderer deps)
  - `src/store/`: Zustand stores (scene/camera/gizmo)
  - `src/renderer/`: WebGPU renderer + pipelines (raytracing, blit) + WebGPU init
  - `src/core/`: math, camera math/controller, raycasting, scene buffers, shared types
  - `src/gizmos/`: gizmo renderer, picking, geometry
  - `src/__tests__/`: vitest suite (unit + contract + integration)
- `docs/`: design docs
  - `docs/architecture.md`: module map + dependency rules + “where to find X”
  - `docs/components.md`: contracts + wiring diagrams + replacement guides
- `bench/`: benchmark runner script (`bench/run.mjs`)
- `benchmarks/`: benchmark artifacts/notes (`benchmarks/baseline.json`, `benchmarks/latest.json`, `benchmarks/README.md`)
- `public/`: static assets + hosting headers (`public/_headers`)
- `dist/`: **generated build output** (not authoritative; produced by `npm run build`)
- `prp/`: staged planning/roadmap docs (useful context, not runtime code)

### 5) Architecture (high-level)
This repo follows a **ports/kernel/adapters** style boundary (see `docs/architecture.md`, `docs/components.md`):
- **`@ports`** (`src/ports/*`): stable, dependency-free contracts:
  - `Command` (writes), `KernelQueries` (reads), `KernelEvents` (notifications)
- **`@kernel`** (`src/kernel/Kernel.ts`): single authority for state transitions and history:
  - `KernelShell.dispatch(command)` applies intent, maintains undo/redo + grouping, emits minimal events
  - The kernel depends on an internal `KernelBackingStore` interface (not a port)
- **Backing store** (`src/adapters/zustand/ZustandSceneBackingStore.ts`):
  - Implements `KernelBackingStore` on top of Zustand `useSceneStore` (legacy store)
  - Also handles ray-pick (`selection.pick`) via `@core` raycaster
- **UI layer** (`src/components/*`):
  - Uses `KernelProvider`/`useKernel()` (React adapter) and dispatches `Command`s
  - Reads state via coarse snapshots (`kernel.queries.getSceneSnapshot()`)
- **Renderer** (`src/renderer/Renderer.ts`):
  - WebGPU render loop that is **dependency-injected** with `RendererDeps`:
    - kernel `queries`/`events` + `getCameraState()` + `getGizmoState()`
  - Subscribes to kernel events to resync scene and reset accumulation when invalidated
- **Composition root / wiring**:
  - Kernel + keyboard input: `src/adapters/react/KernelContext.tsx`
  - WebGPU init + renderer + camera controller + canvas interaction: `src/components/Canvas.tsx`
  - Bench bridge: `src/main.tsx` + `src/bench/benchBridge.ts`

**State management strategy**
- App state is split into:
  - **Kernel-owned**: command application + history semantics + eventing (`src/kernel/Kernel.ts`)
  - **Zustand-owned (current backing)**: scene/camera/gizmo stores (`src/store/*`)
  - The kernel reads/writes the scene through a backing store adapter (Zustand today).

**Rendering pipeline**
- `Renderer` runs every `requestAnimationFrame`:
  - Raytracing compute pass (`src/renderer/RaytracingPipeline.ts`) with progressive accumulation
  - Blit pass (`src/renderer/BlitPipeline.ts`) to present
  - Gizmo overlay (`src/gizmos/GizmoRenderer.ts`) when an object is selected

### 6) Key abstractions (and where to start reading)
If you’re new, read in this order:
- `docs/architecture.md` and `docs/components.md`
- `src/main.tsx` → `src/App.tsx` → `src/adapters/react/KernelContext.tsx` → `src/components/Canvas.tsx`
- `src/kernel/Kernel.ts` and `src/ports/*`
- `src/renderer/Renderer.ts` and `src/renderer/RaytracingPipeline.ts`

Key modules/classes:
- **`Command` / `parseCommand`** (`src/ports/commands.ts`): versioned, serializable write intent surface.
- **`SceneSnapshot` / `KernelQueries`** (`src/ports/queries.ts`): coarse-grained read surface used by UI + renderer.
- **`KernelEvents`** (`src/ports/events.ts`): minimal ordered notification surface (`state.changed`, `render.invalidated`).
- **`KernelShell`** (`src/kernel/Kernel.ts`): dispatch + undo/redo + transform grouping; caches snapshots for low allocations.
- **`ZustandSceneBackingStore`** (`src/adapters/zustand/ZustandSceneBackingStore.ts`): implements kernel backing store on top of `useSceneStore`; handles picking and scene mutations.
- **`KernelProvider` / `useKernel` / `useKernelSceneSnapshot`** (`src/adapters/react/KernelContext.tsx`): React composition + external-store subscription.
- **`Renderer`** (`src/renderer/Renderer.ts`): render loop; listens to kernel events; only uploads GPU scene when `snapshot.objects` reference changes.
- **`RaytracingPipeline`** (`src/renderer/RaytracingPipeline.ts`): compute pipeline, accumulation, scene buffers, uniforms/settings packing.
- **`initWebGPU`** (`src/renderer/webgpu.ts`): adapter/device/context setup and capability checks.
- **`Canvas`** (`src/components/Canvas.tsx`): WebGPU/renderer init, camera controller, selection + gizmo input handling, resize, device-lost UX.

### 7) Testing strategy
- **Where tests live**: `src/__tests__/` and adapter tests under `src/adapters/**/__tests__/`
- **Test runner**: Vitest (`package.json`, config in `vite.config.ts`)
  - Environment: JSDOM (`vite.config.ts`)
  - Global setup: `src/__tests__/setup.ts` (stubs `ResizeObserver`)

**Test organization (examples)**
- **Contract tests** (validate stable contracts/semantics):
  - Ports: `src/__tests__/portsCommands.contract.test.ts`, `portsQueries.contract.test.ts`, `portsEvents.contract.test.ts`
  - Kernel/history: `src/__tests__/kernelHistory.contract.test.ts`, `kernelHistoryGrouping.contract.test.ts`
- **Integration-ish**: `src/__tests__/integration.test.ts` (repo has it; use when touching wiring)
- **Renderer/pipeline unit tests**: `src/__tests__/Renderer.test.ts`, `RaytracingPipeline.test.ts`, `BlitPipeline.test.ts`

**Run a focused subset**
- Single file:
  - `npm run test -- --run src/__tests__/Renderer.test.ts`
- Name filter:
  - `npm run test -- --run -t "KernelShell"`

### 8) Performance & benchmarks
**Benchmark harness**
- Command: `npm run bench`
- Runner: `bench/run.mjs`
  - Builds + runs `vite preview` on `127.0.0.1:${BENCH_PORT}` with `--strictPort`
  - Launches Chrome via CDP, loads `/?__bench=1`, waits for `window.__LIGHTSHOW_BENCH__`, runs:
    - **TTFF** (time-to-first-frame; derived from renderer sample count)
    - **Orbit median FPS** (scripted camera orbit)
  - Writes results: `benchmarks/latest.json`
  - Compares against baseline: `benchmarks/baseline.json` and enforces regression gates

**In-app bench bridge**
- Installed only when `?__bench` is present:
  - `src/main.tsx` dynamically imports `@bench`
  - `src/bench/benchBridge.ts` publishes `window.__LIGHTSHOW_BENCH__` with `run()` and `registerRenderer()`

**Hotspots / rules of thumb**
- **Avoid per-frame allocations in the render loop**:
  - `Renderer` only calls `raytracingPipeline.updateScene()` when `snapshot.objects` **reference changes** (`src/renderer/Renderer.ts`).
  - When editing stores/backing store, preserve **structural sharing** where possible to avoid unnecessary GPU uploads.
- **Accumulation resets are expensive**:
  - Camera moves call `renderer.resetAccumulation()` (see `src/components/Canvas.tsx`).
  - Kernel emits `render.invalidated` for scene changes that require resetting accumulation (`src/kernel/README.md`, `src/kernel/Kernel.ts`).
- **Continuous transforms are grouped** into one undo step:
  - `history.group.begin` / `history.group.end` are used during gizmo drags (`src/components/Canvas.tsx`).

### 9) Coding conventions & constraints (important)
- **Aliased imports must use module entrypoints**:
  - ESLint forbids `@core/*`, `@renderer/*`, etc. from outside the module.
  - Prefer: `import { Camera } from '@core'` (via `src/core/index.ts`) not `import { Camera } from '@core/Camera'`.
  - Rule: `no-restricted-imports` patterns in `eslint.config.js`.
- **No dependency cycles**: enforced via `import/no-cycle` (`eslint.config.js`).
- **Directionality constraints**:
  - `src/kernel/**` cannot import React/Zustand/UI/renderer/gizmos/hooks (enforced in `eslint.config.js`).
  - `src/ports/**` is dependency-free and must not import implementations.
- **TypeScript**: strict, unused locals/params are errors (`tsconfig.json`).
- **React**: Vite + React Refresh; hook linting is on but `exhaustive-deps` is off (`eslint.config.js`).

### 10) Common tasks / playbook
**Add a new command (new user intent)**
- **Define the contract**: extend `Command` union + `parseCommand` in `src/ports/commands.ts`
- **Implement behavior**:
  - Kernel typically stays generic; behavior is applied via backing store:
  - Add handling in `src/adapters/zustand/ZustandSceneBackingStore.ts` (or your new backing store)
- **Wire UI**: dispatch via `kernel.dispatch(...)` from the relevant component (often in `src/components/panels/*` or `src/components/Canvas.tsx`)
- **Add tests**:
  - Contract/parse semantics: `src/__tests__/portsCommands.contract.test.ts`
  - Behavior/history semantics: kernel/history contract tests (`src/__tests__/kernelHistory*.test.ts`) or add a targeted unit test

**Add a new query field**
- Update `src/ports/queries.ts` (`SceneSnapshot`)
- Update kernel snapshot construction in `src/kernel/Kernel.ts`
- Update backing store state shape if needed (`src/adapters/zustand/ZustandSceneBackingStore.ts`)

**Modify selection/picking**
- Command is `selection.pick` (`src/ports/commands.ts`)
- Backing store uses raycaster: `src/adapters/zustand/ZustandSceneBackingStore.ts` (calls `@core` `raycaster`)

**Modify gizmo interactions**
- Input + drag grouping: `src/components/Canvas.tsx`
- Gizmo store: `src/store/gizmoStore.ts`
- Gizmo rendering/picking: `src/gizmos/*` (renderer + raycaster + geometry)

**Modify camera behavior**
- Camera store: `src/store/cameraStore.ts`
- DOM controller: `src/core/CameraController.ts`
- Canvas wiring: `src/components/Canvas.tsx`

**Modify renderer behavior / shaders**
- Main loop + kernel event reactions: `src/renderer/Renderer.ts`
- Compute shader/pipeline: `src/renderer/RaytracingPipeline.ts` + `src/renderer/shaders/raytracer.wgsl`
- Presentation: `src/renderer/BlitPipeline.ts`

**Add a new UI component**
- Place in `src/components/ui/*` (reusable primitives) or `src/components/panels/*` (feature panels).
- Tailwind tokens/colors are in `tailwind.config.js`.

**Add/adjust benchmark**
- Runner logic/gates: `bench/run.mjs`
- In-app metrics: `src/bench/benchBridge.ts`
- Baseline numbers: `benchmarks/baseline.json` (committed)

### 11) Gotchas / sharp edges
- **WebGPU availability**:
  - Many browsers/machines won’t support WebGPU; `initWebGPU()` throws with a compatibility message (`src/renderer/webgpu.ts`).
  - Device loss is handled and surfaced to the user in `src/components/Canvas.tsx`.
- **Bench stability**:
  - Bench assumes the page stays “active” so `requestAnimationFrame` isn’t throttled; it will retry if the orbit doesn’t advance (`bench/run.mjs`, `src/bench/benchBridge.ts`).
  - Bench launches a real Chrome instance by default (not Playwright/headless).
- **Module boundary lint rules can surprise you**:
  - If an import “should work” but ESLint blocks it, import from the module `index.ts` entrypoint instead (see `eslint.config.js`).
- **Renderer upload behavior depends on reference equality**:
  - `Renderer` only re-uploads the GPU scene if `snapshot.objects` reference changes. Be deliberate about when arrays are replaced vs reused (`src/renderer/Renderer.ts`).

### 12) Glossary
- **WebGPU**: Modern browser GPU API used for compute + rendering.
- **WGSL**: WebGPU Shading Language (shader code in `*.wgsl`).
- **Kernel**: App core that applies commands, manages history, and emits events (`src/kernel/*`).
- **Ports**: Dependency-free contracts between subsystems (`src/ports/*`).
- **Backing store**: Implementation behind the kernel that reads/writes scene state (Zustand adapter today).
- **SceneSnapshot**: Coarse, read-only view of scene state used by UI/renderer (`src/ports/queries.ts`).
- **Accumulation**: Progressive path tracing accumulation over frames; reset on invalidation.
- **TTFF**: “Time to first frame” measured by the bench bridge when the renderer first produces samples.


