# Step 04 — Add core mesh generators for built-in primitives

## Step title and goal (1–2 sentences)
Introduce deterministic mesh generators in `@core` for the six built-in primitives, producing positions, normals, and indices suitable for ray tracing and future imports.

## Scope of changes
- **Files/modules likely to change (best-effort)**:
  - `src/core/` (new files for mesh generation; exported via `src/core/index.ts`)
  - `src/__tests__/` (new unit tests for mesh generation)
- **What must not change**:
  - No renderer/shader changes
  - No UI changes

## Implementation details
- Use the following **approved defaults** (authoritative source: `prp/v4/base.md`, OQ1/OQ2 resolved):
  - **Tessellation (fixed resolution; tunable in a later pass)**:
    - UV sphere: 32 segments × 16 rings (~1024 tris)
    - Cylinder (capped): 32 radial segments
    - Cone (capped): 32 radial segments
    - Torus: major 32 × minor 16 (~1024 tris)
    - Capsule: 32 radial segments; hemispheres subdivided to match sphere ring density (deterministic)
  - **Canonical object-space dimensions (unit conventions)**:
    - Sphere: radius = 1, centered at origin
    - Cuboid: half-extents = (1,1,1), centered at origin (spans [-1,+1] on each axis)
    - Cylinder (capped): radius = 1, half-height = 1, centered at origin, aligned to +Y (spans y ∈ [-1,+1])
    - Cone (capped): base radius = 1, half-height = 1, centered at origin, aligned to +Y, apex at y=+1 and base at y=-1
    - Torus: major radius R = 1, minor radius r = 0.35, centered at origin, aligned to +Y (ring lies in XZ plane)
    - Capsule: radius = 1; half-height = 1 is the cylinder half-length (excluding hemispheres). Cylinder spans y ∈ [-1,+1], hemisphere centers at y=±1, total spans y ∈ [-2,+2]
  - **Winding / normals**:
    - Generated meshes must use consistent winding and outward-facing normals such that `frontFace` detection via `dot(ray.direction, normal) < 0` is stable for glass.

- Add a `Mesh` type under `@core` (exported from `src/core/index.ts`) with:
  - `positions: Float32Array | number[]` (decision: prefer `Float32Array` for GPU upload)
  - `normals: Float32Array | number[]`
  - `indices: Uint32Array | number[]`
  - `aabbMin: [number, number, number]`
  - `aabbMax: [number, number, number]`
- Add deterministic mesh generators:
  - UV sphere generator with fixed segment/ring counts (per Owner-approved defaults).
  - Cuboid generator using per-face vertices (flat normals).
  - Cylinder (capped): separate vertex rings for caps vs side (hard edge).
  - Cone (capped): separate cap vs side (hard edge).
  - Capsule: closed, with smooth normals; define canonical dimensions explicitly.
  - Torus: closed, with smooth normals; define canonical radii explicitly.
- Ensure all meshes are centered at origin and aligned to +Y where applicable (per the approved canonical dimensions above).

## Unit test plan
- **Add**: `src/__tests__/meshes.test.ts` (or similar) to assert for each primitive:
  - indices length is multiple of 3
  - no out-of-range indices
  - all normals are finite and near-unit length (within tolerance)
  - AABB bounds contain all vertices (within tolerance)
  - determinism: repeated generation yields identical buffers
  - “closed primitives” have no obvious holes by construction (at minimum: caps exist for cylinder/cone; torus has continuous topology)
  - AABB sanity for canonical dimensions (within tolerance):
    - Sphere: AABB approximately [-1,-1,-1]..[+1,+1,+1]
    - Cuboid: AABB exactly [-1,-1,-1]..[+1,+1,+1]
    - Cylinder (capped): AABB approximately [-1,-1,-1]..[+1,+1,+1]
    - Cone (capped): AABB approximately [-1,-1,-1]..[+1,+1,+1]
    - Torus (R=1, r=0.35): AABB approximately [-(1+0.35), -0.35, -(1+0.35)]..[(1+0.35), +0.35, (1+0.35)]
    - Capsule (radius=1, half-height=1 as cylinder half-length): AABB approximately [-1,-2,-1]..[+1,+2,+1]

## Documentation plan
- If new `@core` files are added, update `src/core/README.md` only if it exists and contains relevant extension points. Otherwise, no docs.

## Verification
- **Automated**:
  - `npm test -- --run` (expected: pass)
  - `npm run lint` (expected: pass)
- **Manual (Owner)**:
  - None (renderer not using meshes yet).

## Acceptance criteria for this step (checklist)
- [ ] Mesh generators exist for sphere/cuboid/cylinder/cone/capsule/torus.
- [ ] Mesh outputs are deterministic and pass sanity checks (indices, normals, AABB).
- [ ] Tests and lint pass.

## Risks / edge cases for this step (brief)
- Off-by-one errors in index generation; tests must catch out-of-range indices.
- Cone apex handling can create degenerate triangles if implemented incorrectly.

## Rollback notes (what to revert if needed)
- Revert newly added `@core` mesh generator files and their tests.

## Required agent workflow (must be repeated verbatim in EVERY step doc)
1. Read this atomic step document fully and build a thorough understanding. If any detail is unclear, ask the Owner targeted questions before coding.
2. If documentation updates are needed to reflect newly confirmed understanding, draft the doc changes and ask the Owner for approval **before proceeding**.
3. Execute the step in this order:
   - Implement the step (code changes)
   - Add/adjust unit tests
   - Run the full test suite: `npm test -- --run`
   - Run lint: `npm run lint`
   - Update docs if needed
   - Provide **manual test actions** for the Owner
   - The Owner will test/verify and may request modifications (expect iteration)
   - After the Owner approves the step, run benchmarks: `npm run bench` (must not regress materially)
   - If benchmarks pass, propose a commit message in **Angular/conventional commits** format (e.g. `feat: ...`, `fix: ...`, `refactor: ...`)
   - After the Owner approves the commit message, create the git commit


