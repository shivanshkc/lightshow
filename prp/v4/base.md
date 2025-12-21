# Mesh-based primitives (ray tracing) — PRP v4

## Overview / problem statement

Lightshow currently supports two primitives: **sphere** and **cuboid**. Both are ray traced using **dedicated analytic intersection functions** in `src/renderer/shaders/raytracer.wgsl` (`intersectSphere`, `intersectBox`). This approach does not scale to adding more primitives and is incompatible with the near-future requirement of importing arbitrary meshes (OBJ/glTF).

This PRP defines a new rendering approach where all primitives are represented as **triangle meshes** and are ray traced via **triangle intersection**. To keep performance acceptable, the system must introduce a **per-mesh BVH** (BLAS) and be designed so a **TLAS** can be added later with minimal churn.

This PRP is **authoritative** for requirements; implementation must remain within the project’s decoupled architecture (see `docs/architecture.md` and `docs/components.md`).

---

## Goals (explicit)

G1. Add the following built-in primitives (mesh-based) to the editor:
- Sphere (UV sphere)
- Cuboid
- Cylinder (closed/capped)
- Cone (closed/capped)
- Capsule (closed)
- Torus (closed)

G2. Replace analytic intersections (`intersectSphere`, `intersectBox`) with a uniform mesh-raytracing path:
- Triangle intersection for all primitives.
- Per-mesh acceleration structure (BLAS / BVH) to avoid brute-force triangle tests for all triangles.

G3. Preserve the existing decoupled architecture:
- UI dispatches `Command`s and reads `KernelQueries`.
- Renderer consumes snapshot data via injected deps and must not import stores directly.
- Cross-module imports must use module `index.ts` public APIs (no deep `@core/*` imports).

G4. Be “TLAS-ready”:
- Initial release may loop instances, but data structures and shader interfaces must allow introduction of a TLAS later without redesigning BLAS or triangle hit logic.

G5. Keep the codebase green at every step:
- `npm test -- --run` passes.
- `npm run lint` passes.
- Benchmarks (`npm run bench`) are run only after Owner approval for the relevant step, and must not regress materially.

---

## Non-goals (explicit)

NG1. External mesh import (OBJ/glTF) is **out of scope** for this release.

NG2. TLAS implementation is **out of scope** for this release (but design must be TLAS-ready).

NG3. LOD (level-of-detail), adaptive tessellation, or user-adjustable mesh resolution are **out of scope**. Primitives use **fixed-resolution meshes**.

NG4. Adding new UI primitives beyond the six listed (e.g., quad, disk/plane) is **out of scope**.

NG5. Changing material models (plastic/metal/glass/light) is **out of scope**, except where required to support mesh intersections (e.g., correct normals/t values).

NG6. Adding volumetric rendering beyond surface-based dielectrics (e.g., heterogeneous volumes, participating media) is **out of scope**.

---

## User stories / use-cases

US1. As a user, I can add a Cylinder/Cone/Capsule/Torus from the “Add Object” panel, select it, transform it, and assign any existing material including glass.

US2. As a user, glass primitives look “solid” (enter/exit refraction) just like the current sphere/cuboid glass behavior.

US3. As a user, selection/picking works consistently for all primitives (clicking an object selects the correct object; selection highlight works).

US4. As a developer, the renderer is structured to later add imported meshes and TLAS without cross-layer coupling.

---

## Definitions (shared vocabulary)

- **Mesh**: Triangle geometry defined by vertex positions and triangle indices. In this release, meshes are generated procedurally for built-in primitives.
- **Instance**: A scene object referencing a mesh, with transform + material. Multiple instances may reference the same mesh.
- **BLAS**: Bottom-level acceleration structure (BVH) built over a mesh’s triangles.
- **TLAS**: Top-level acceleration structure (BVH) built over instances (out of scope now, but design must allow it later).
- **Watertight / closed mesh**: A surface mesh with no holes/cracks such that a ray entering a dielectric can later exit correctly.

---

## Functional requirements (numbered, testable)

### Primitive availability & creation

FR1. The application must support `PrimitiveType` values:
- `sphere`
- `cuboid`
- `cylinder`
- `cone`
- `capsule`
- `torus`

FR2. The UI must expose “Add Object” actions for all primitives in FR1. Each action must:
- dispatch a kernel command `object.add` with the corresponding primitive type
- respect the existing object limit (`LIMITS.maxObjects`)

FR3. The backing store adapter for scene state must implement `object.add` for all new primitives without violating layering (i.e., renderer/store are not imported into the kernel).

### Mesh-based representation

FR4. Every primitive in FR1 must be represented by a triangle mesh and ray traced using **triangle intersection**, not analytic primitive intersections.

FR5. Each built-in primitive mesh must provide:
- `positions`: array of 3D points (float32)
- `indices`: triangle index buffer (u32 or u16; u32 preferred for import readiness)
- `normals`: per-vertex normals sufficient for smooth shading (except cuboid which must use per-face normals)

FR6. Shading normals must behave as follows:
- **Cuboid**: flat shading (hard edges) via per-face normals.
- **Sphere/Cylinder/Cone/Capsule/Torus**: smooth shading on curved surfaces.
- Cylinder/Cone caps must have flat normals and a hard edge where caps meet the side surface (no vertex sharing between cap ring and side ring).

FR7. The current “glass looks solid” behavior must be preserved for mesh primitives by treating glass as a dielectric surface:
- on each surface hit, determine entering vs exiting using `frontFace` logic based on the hit normal
- apply refraction/reflection as currently done in the shader

### Acceleration structures (BLAS now; TLAS-ready design)

FR8. The renderer must build and use a per-mesh BVH (BLAS) for ray-mesh intersections.

FR9. The initial implementation may iterate all visible instances in the shader, but must include a fast per-instance AABB reject test before BLAS traversal.

FR10. The GPU-facing data model must represent:
- a mesh library (geometry + BLAS) addressable by `meshId`
- an instance list where each instance references `meshId`

FR11. The design must make it possible to add TLAS later without redefining BLAS or triangle-hit logic. Concretely:
- shader functions for “intersect a mesh via BLAS” must be reusable by a future TLAS traversal
- instance data layout must remain valid when instance iteration is replaced by TLAS traversal

### Transform semantics & compatibility

FR12. Existing transform semantics must remain compatible:
- Cuboid `transform.scale` continues to represent **half-extents** (see “Compatibility” section).
- Non-uniform `scale: [x,y,z]` must be supported for all primitives.

FR13. Ray intersection results must be correct in world space:
- returned hit position is in world space
- returned normal is in world space and normalized
- returned `t` is the distance along the world ray direction (compatible with existing shading + selection highlight logic)

### Picking/selection

FR14. CPU-side picking (`src/core/Raycaster.ts`) must support selection of all primitives in FR1 and must not depend on analytic sphere/box intersections.

FR15. Renderer selection highlight must continue to function:
- selected-object index semantics remain “index in the visible objects stream”
- highlight must be stable (non-jittered ray) as currently implemented

---

## Non-functional requirements (performance, reliability, UX constraints)

NFR1. Performance: interactive rendering must not regress materially relative to baseline for the default scene. The benchmark harness (`npm run bench`) is the gate; acceptable regression thresholds must be discussed/approved per step before running benchmarks.

NFR2. Reliability: the renderer must not crash or generate NaNs for:
- degenerate triangles in generated primitives (should not exist, but code must be robust)
- rays parallel to triangles/caps (handle near-zero determinants safely)

NFR3. Determinism: generated primitive meshes and their BLAS must be deterministic for a given configuration (same indices/vertices across runs).

NFR4. No cross-layer coupling: changes must respect `docs/architecture.md` dependency rules and “public API only” imports.

NFR5. Code cleanup / no-dead-code (mandatory): by the end of the rollout, there must be no dead, unused, or obsolete code left behind from superseded implementations. Concretely:
- remove unused functions/classes/components/stores/adapters/ports/utilities as they become obsolete
- remove unused exports/re-exports (including module barrel `index.ts` exports)
- remove or update tests that target obsolete behavior
- remove unused assets/config and update documentation references
- update all call sites to new APIs and delete old APIs once unreferenced
Cleanup must be sequenced safely (do not delete code that is still required by earlier steps) and must respect the decoupled architecture (no cross-layer shortcuts).

---

## Architecture & design constraints (derived from docs)

AC1. Follow module boundaries as defined in `docs/architecture.md`:
- `@ports` is dependency-free and defines the command/query/event contracts.
- `@kernel` depends only on `@ports` and must not import WebGPU/Zustand/UI.
- `@renderer` consumes `@ports` contracts via injected deps; must not import stores directly.
- `@components` dispatch commands + read queries; must not import store singletons directly (only via adapters).

AC2. Cross-module imports must go through module entrypoints (`index.ts`). Imports like `@core/*` are disallowed.

AC3. No cyclic imports are allowed (enforced by ESLint `import/no-cycle`).

AC4. Renderer update rules must remain allocation-light:
- do not introduce per-frame allocations proportional to object count
- scene uploads should remain tied to reference changes in snapshot objects (as today)

---

## Data model / API / state changes

### Ports (`@ports`)

DM1. Update `src/ports/commands.ts`:
- Extend `PrimitiveType` union with the new primitives in FR1.
- Extend `parseCommand` validation for `object.add` to accept new primitives.

### Core types (`@core`)

DM2. Update `src/core/types.ts`:
- Extend `PrimitiveType` union with the new primitives in FR1.
- Add any mesh/BVH data structures needed for mesh generation and BLAS construction under `@core` (or a new `@core` submodule), exported via `src/core/index.ts`.

### Scene objects and instances

DM3. Scene objects remain “one object → one material” and have a primitive `type` matching FR1.

DM4. Renderer must derive/assign a stable `meshId` for each built-in primitive type. Multiple objects of the same primitive type may reference the same `meshId`.

---

## UI/UX requirements

UI1. Update the “Add Object” panel to include buttons for Cylinder, Cone, Capsule, and Torus.

UI2. Button labels must match the primitive names exactly: `Sphere`, `Cuboid`, `Cylinder`, `Cone`, `Capsule`, `Torus`.

UI3. No new primitive settings UI is introduced (no caps toggles, no segment sliders).

---

## Edge cases & error handling

EC1. Rays parallel to triangles or near-degenerate triangles must not produce NaNs; triangle intersection must safely reject when determinant is near zero.

EC2. BVH traversal must avoid infinite loops; node indexing must be validated in tests.

EC3. Generated meshes must be watertight for “closed” primitives to preserve expected glass behavior:
- sphere, cuboid, cylinder (capped), cone (capped), capsule, torus

---

## Compatibility / migration notes

CM1. The Cornell box default scene and any existing tests must continue to work after migration.

CM2. Cuboid scale semantics: current code treats cuboid `transform.scale` as **half-extents** (full size is `2 * scale`). This must remain true after cuboid becomes a mesh.

CM3. Selection index semantics in the renderer must remain in terms of visible objects (as currently implemented in `src/renderer/Renderer.ts`).

---

## Acceptance criteria checklist (release-level)

- [ ] Can add all primitives (Sphere, Cuboid, Cylinder, Cone, Capsule, Torus) from UI and they appear in the scene.
- [ ] All primitives are ray traced via triangle mesh intersections (no analytic `intersectSphere`/`intersectBox` usage).
- [ ] Glass material refracts as a “solid” closed object for all closed primitives.
- [ ] CPU picking can select any primitive correctly.
- [ ] Selection highlight continues to work and is stable.
- [ ] `npm test -- --run` passes.
- [ ] `npm run lint` passes.
- [ ] After Owner approval, `npm run bench` shows no material regression relative to baseline for agreed metrics.
- [ ] No dead code: analytic intersection paths and other superseded APIs are removed; unused exports/imports are eliminated; tests/docs are updated; repository remains clean (tests + lint + bench pass).

---

## Open questions / assumptions (explicit)

OQ1 (RESOLVED — approved defaults; may be tuned later). Fixed-resolution tessellation defaults for built-in primitive meshes:
- UV sphere: 32 segments × 16 rings (~1024 tris)
- Cylinder (capped): 32 radial segments
- Cone (capped): 32 radial segments
- Torus: major 32 × minor 16 (~1024 tris)
- Capsule: 32 radial segments; hemispheres subdivided to match sphere ring density (implementation must be deterministic)

OQ2 (RESOLVED — approved canonical dimensions). Canonical object-space dimensions for built-in primitive meshes:
- Sphere: radius = 1, centered at origin.
- Cuboid: half-extents = (1,1,1), centered at origin (spans [-1,+1] on each axis). Cuboid `transform.scale` continues to mean half-extents.
- Cylinder (capped): radius = 1, half-height = 1, centered at origin, aligned to +Y (spans y ∈ [-1,+1]).
- Cone (capped): base radius = 1, half-height = 1, centered at origin, aligned to +Y, with apex at y=+1 and base at y=-1.
- Torus: major radius R = 1, minor radius r = 0.35, centered at origin, aligned to +Y (ring lies in XZ plane).
- Capsule: radius = 1; half-height = 1 is defined as the cylinder half-length (excluding hemispheres). Concretely: cylinder spans y ∈ [-1,+1], hemisphere centers at y=±1, total capsule spans y ∈ [-2,+2].

ASSUMPTION A1 (explicit): All built-in meshes are generated with consistent winding and outward-facing normals such that `frontFace` detection via `dot(ray.direction, normal) < 0` is stable for glass materials.

