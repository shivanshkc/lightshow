# Lightshow — v3.2 PRP: Add 4 new primitive objects (Cylinder, Cone, Torus, Capsule)

## Overview / problem statement

Lightshow currently supports only two primitive object types: **Sphere** and **Cuboid**. The Owner requires adding four additional primitives:

- **Cylinder** (solid, capped)
- **Cone** (solid, capped)
- **Torus** (solid; ray intersection must be implemented via a **quartic** method)
- **Capsule** (solid; cylinder + hemispherical caps)

The implementation must integrate end-to-end across:

- Scene data model and command contracts
- UI creation flows
- UI transform controls (shape-specific parameters)
- CPU ray picking
- GPU/WebGPU raytracing shader intersections + scene buffer encoding
- Tests, lint, and benchmark gates

This PRP is the authoritative, testable specification for that work.

---

## Goals (explicit)

G1. Add **4 new primitive types** (Cylinder, Cone, Torus, Capsule) as first-class scene objects.

G2. Provide **user-friendly transform controls** for the new primitives:

- Cylinder/Cone/Capsule use **Radius** + **Height** inputs (not raw X/Y/Z scale).
- Torus uses **Inner radius** + **Outer radius** inputs (not raw X/Y/Z scale).

G3. Add object creation UI for all 6 primitives (Sphere, Cuboid, Cylinder, Cone, Torus, Capsule) with a **2-column × 3-row** button layout.

G4. Ensure new primitives:

- Render correctly in the WebGPU raytracer
- Can be selected via CPU-side picking (raycaster)
- Participate in existing selection, transform commands, material system, and history semantics without regressions

G5. Keep the repository “green” throughout the rollout:

- `npm test -- --run` passes after each atomic step
- `npm run lint` passes after each atomic step
- `npm run bench` is run after each step only **after Owner approval** for that step; it must not regress materially

G6. By the end of the rollout, there is **no dead code**: obsolete code paths, unused exports, and superseded behavior introduced during the rollout are removed.

---

## Non-goals (explicit)

NG1. No new material types or changes to the material model beyond what is required to render the new primitives with existing materials.

NG2. No changes to kernel history behavior, command versioning (`v: 1`), or undo/redo semantics beyond adding support for the new primitives through existing commands.

NG3. No new dependencies.

NG4. No UI redesign outside:

- Add Object panel button layout and new primitive buttons
- Transform panel scale controls for the new primitives

NG5. No changes to camera behavior, gizmo behavior, renderer architecture, or store architecture unless explicitly required for correctness and called out in a step doc.

---

## User stories / use-cases

US1. As a user, I can add a **Cylinder** to the scene and see it rendered as a capped solid cylinder.

US2. As a user, I can add a **Cone** to the scene and see it rendered as a capped solid cone.

US3. As a user, I can add a **Torus** and see it rendered as a solid torus. Torus intersection uses a quartic method.

US4. As a user, I can add a **Capsule** and see it rendered as a capsule (cylinder + hemispherical ends).

US5. As a user, I can select any of these objects by clicking/tapping on them (CPU picking).

US6. As a user, I can edit shape parameters using friendly inputs:

- Cylinder/Cone/Capsule: radius + height
- Torus: inner + outer radius

US7. As a user, I can still add Sphere and Cuboid and edit them as before (no regressions).

---

## Functional requirements (numbered, testable)

### FR1 — Primitive types

FR1.1. The system MUST define and support the following `PrimitiveType` values:

- `sphere`
- `cuboid`
- `cylinder`
- `cone`
- `torus`
- `capsule`

FR1.2. `object.add` command parsing MUST accept these `PrimitiveType` values and reject unknown values (returning `null` from `parseCommand`).

### FR2 — Default dimensions and naming

FR2.1. Default object names (on creation) MUST be:

- Sphere → `Sphere`
- Cuboid → `Cuboid`
- Cylinder → `Cylinder`
- Cone → `Cone`
- Torus → `Torus`
- Capsule → `Capsule`

FR2.2. Default dimensions (in UI terms) MUST be:

- Cylinder: radius = **1**, height = **1**
- Cone: radius = **1**, height = **1**
- Capsule: radius = **1**, height = **3**
- Torus: inner radius = **0.5**, outer radius = **1**

FR2.3. Default transforms MUST use:

- position `[0,0,0]`
- rotation `[0,0,0]` (radians in storage)

### FR3 — Orientation convention

FR3.1. Cylinder, Cone, and Capsule height axis MUST be the object’s **local +Y axis** before rotation is applied.

FR3.2. Rotating the object MUST rotate the primitive’s orientation (consistent with current rotation application for sphere/cuboid).

### FR4 — UI: Add Object panel layout and behavior

FR4.1. The Add Object panel MUST show exactly **6 buttons** in a **2-column × 3-row** layout:

- Row 1: Sphere | Cuboid
- Row 2: Cylinder | Cone
- Row 3: Torus | Capsule

FR4.2. Clicking a button MUST dispatch `Command { v: 1, type: 'object.add', primitive: <type> }`.

FR4.3. The existing max object limit behavior MUST be preserved (disable buttons when at limit; show limit warning as currently implemented).

### FR5 — UI: Transform panel shape-parameter editing

FR5.1. Sphere MUST continue to use a single numeric input labeled `Radius` (existing behavior).

FR5.2. Cuboid MUST continue to use a 3-component input labeled `Scale` (existing behavior).

FR5.3. Cylinder MUST display:

- `Radius` (number input)
- `Height` (number input)

FR5.4. Cone MUST display:

- `Radius` (number input)
- `Height` (number input)

FR5.5. Capsule MUST display:

- `Radius` (number input)
- `Height` (number input, representing total end-to-end height)

FR5.6. Torus MUST display:

- `Inner radius` (number input)
- `Outer radius` (number input)

FR5.7. Editing any of these fields MUST dispatch `transform.update` commands only (no new command types), updating the object’s stored `transform.scale` using the mapping in **Data model / parameter encoding**.

### FR6 — CPU picking (Raycaster)

FR6.1. CPU picking MUST correctly select the closest visible object intersected by a ray for all 6 primitive types.

FR6.2. CPU picking MUST respect object transform:

- translation via `transform.position`
- rotation via `transform.rotation` (Euler)
- shape parameters via the primitive’s encoded values in `transform.scale`

FR6.3. CPU picking MUST treat objects with invalid/degenerate parameters as “non-hit” (see Edge cases).

### FR7 — GPU raytracing (rendering)

FR7.1. The WebGPU raytracer shader MUST implement ray intersections for the 4 new primitives, respecting object transform and encoded parameters.

FR7.2. Torus intersection MUST be implemented using a **quartic** method (not raymarch/SDF stepping).

FR7.3. Each primitive intersection MUST produce:

- a hit distance `t` (closest positive intersection)
- a surface normal in object space (normalized), transformed to world space as current code does

FR7.4. Scene buffer encoding MUST remain compatible with the existing shader struct layout (no changes that break alignment or require new bindings unless explicitly approved and documented).

---

## Non-functional requirements (performance, reliability, UX)

NFR1. No new npm dependencies.

NFR2. No new persistent background loops or polling.

NFR3. Rendering performance must remain within existing benchmark gates; any expected impacts (especially from torus quartic solve) MUST be called out in the relevant step doc.

NFR4. UI inputs MUST clamp or reject invalid values deterministically (see Edge cases & error handling) so the system never crashes on invalid parameters.

---

## Architecture & design constraints (derived from `docs/architecture.md` and `docs/components.md`)

AC1. Module boundaries and directionality MUST be respected:

- `@ports` is dependency-free and contains only contracts/types.
- `@kernel` is the single authority for state transitions and history; it depends on `@ports` but not React/WebGPU/Zustand.
- `@renderer` consumes kernel queries/events via injected deps; it MUST NOT import Zustand stores directly.
- `@components` (React UI) MUST dispatch commands and read queries; stores must be accessed via adapters.

AC2. Aliased import rule MUST be obeyed:

- Cross-module aliased imports MUST use the module entrypoint (e.g. `import { X } from '@core'`).
- Imports like `@core/*` are disallowed.

AC3. No import cycles (`import/no-cycle`).

AC4. Command stability:

- Commands are stable + serializable; `Command.v` remains `1`.
- Adding new `PrimitiveType` values is allowed but must preserve validation in `parseCommand`.

AC5. Renderer creation and wiring remain in existing composition roots (per `docs/components.md`).

**Conflict check**: No Owner requirements conflict with these constraints. The plan adds primitives by extending ports contracts + core math + renderer shader + UI panels, without introducing cross-layer coupling.

---

## Data model / API / state changes

### DM1 — PrimitiveType extension

- Extend `PrimitiveType` in `src/ports/commands.ts` and `src/core/types.ts` to include the 4 new primitives.

### DM2 — Parameter encoding (authoritative mapping)

To preserve the existing GPU scene buffer layout, shape parameters are encoded into `transform.scale: [x,y,z]` per primitive as follows:

- **Sphere**: `scale = [radius, radius, radius]` (existing)
- **Cuboid**: `scale = [halfX, halfY, halfZ]` (existing)
- **Cylinder (capped)**: `scale = [radius, halfHeight, radius]` where `halfHeight = height / 2`
- **Cone (capped)**: `scale = [baseRadius, halfHeight, baseRadius]` where `halfHeight = height / 2`
- **Capsule**: `scale = [radius, halfHeightTotal, radius]` where `halfHeightTotal = height / 2`
  - Intersection uses `segmentHalf = max(halfHeightTotal - radius, 0)`
- **Torus**: `scale = [R, r, r]` where:
  - UI provides `inner` and `outer`
  - Convert to:
    - `R = (outer + inner) / 2`
    - `r = (outer - inner) / 2`

### DM3 — Scene buffer objectType mapping

GPU scene buffer MUST encode an `objectType` discriminator with distinct values for each primitive type (exact values are internal but must be consistent between CPU encoder and WGSL shader).

---

## UI/UX requirements

UI1. Add Object panel must use the 2×3 grid and labels specified in FR4.

UI2. Transform panel must present friendly parameter inputs specified in FR5.

UI3. Inputs must enforce minimums and invariants:

- radius > 0
- height > 0
- torus: outer > inner > 0

UI4. When invalid values are attempted, the UI MUST resolve deterministically (clamp or reject) and MUST NOT dispatch NaN/Infinity values.

UI5. Add Object buttons MUST be **text-only** (no icons), showing the primitive name label only.

---

## Edge cases & error handling

EC1. All numeric inputs must reject or clamp non-finite values (NaN/Infinity) before dispatching commands.

EC2. Any primitive with parameters that violate invariants MUST be treated as “no hit” by CPU picking and “no hit” by GPU intersection:

- radius <= 0
- height <= 0
- torus: outer <= inner or inner <= 0

EC3. Capsule: if `height < 2 * radius`, capsule MUST degrade gracefully by using `segmentHalf = max(height/2 - radius, 0)` (effectively becoming a sphere-like shape). This is not an error.

EC4. Cone: apex/base convention MUST be explicitly defined:

- Base cap center is at local `y = -halfHeight` with radius = `baseRadius`.
- Apex is at local `y = +halfHeight` with radius = `0`.

---

## Compatibility / migration notes

CM1. Existing scenes (in-memory) containing only sphere/cuboid must behave identically after the rollout (no changes in interpretation of existing `scale` semantics for those types).

CM2. Commands remain `v: 1`; `parseCommand` changes must remain backward compatible and only broaden accepted `primitive` values.

---

## Acceptance criteria checklist (final state)

### Automated

- [ ] `npm test -- --run` passes
- [ ] `npm run lint` passes
- [ ] After Owner approval of the final step: `npm run bench` passes without material regressions

### Functional

- [ ] Add Object panel shows 6 buttons in a 2×3 grid, in the specified order
- [ ] Each new primitive can be created and appears in the object list with the correct name and type
- [ ] Transform panel shows correct parameter UI per primitive (radius/height; inner/outer)
- [ ] CPU picking selects cylinder/cone/torus/capsule correctly and selects the closest hit
- [ ] GPU raytracer renders cylinder/cone/torus/capsule correctly
- [ ] Torus intersection is quartic (no raymarch stepping)

### Cleanup / no dead code

- [ ] No unused exports/imports introduced during rollout remain
- [ ] No obsolete code paths remain (including temporary helpers/stubs)
- [ ] Tests updated to reflect new primitives; no obsolete tests remain

---

## Open questions / assumptions (explicit)
None.
