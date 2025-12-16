# Lightshow Development Stages

This directory contains detailed Product Requirement Prompts (PRPs) for each development stage of Lightshow, a browser-based WebGPU raytracing application.

Each PRP is designed for **one-pass implementation** — containing all necessary specifications, code examples, and testing requirements to complete the stage without backtracking.

---

## Stage Overview

| Stage | Name | Effort | Description |
|-------|------|--------|-------------|
| [01](./stage-01-project-setup.md) | Project Setup & WebGPU Foundation | Small | Vite, TypeScript, React, Tailwind, WebGPU init |
| [02](./stage-02-basic-raytracer.md) | Basic Raytracer | Medium | Ray generation, sphere/box intersection, normal shading |
| [03](./stage-03-scene-data.md) | Scene Data Pipeline | Medium | Zustand store, GPU buffers, dynamic scene |
| [04](./stage-04-lighting.md) | Lighting & Shadows | Medium | Path tracing, shadows, global illumination |
| [05](./stage-05-materials.md) | Materials System | Medium | Material types: Plastic, Metal, Glass, Light |
| [06](./stage-06-camera.md) | Camera Controls | Small | Orbit, pan, zoom, focus |
| [07](./stage-07-ui-shell.md) | UI Shell | Medium | Three-panel layout, dark theme |
| [08](./stage-08-selection.md) | Object Selection & Picking | Medium | Click-to-select, raycasting |
| [09](./stage-09-gizmo-translate.md) | Translation Gizmo | Large | Axis/plane translation, snapping |
| [10](./stage-10-gizmo-rotate-scale.md) | Rotation & Scale Gizmos | Large | Rotation rings, scale handles |
| [11](./stage-11-properties-panel.md) | Properties Panel | Medium | Transform inputs, material controls |
| [12](./stage-12-scene-ops.md) | Scene Operations | Medium | Delete, duplicate, undo/redo, rename |
| [13](./stage-13-polish.md) | Polish & UX | Medium | Visual polish, performance, edge cases |
| [14](./stage-14-export.md) | Export & Persistence | Small | Save/load JSON, export PNG, auto-save |

---

## Dependency Graph

```
Stage 1 ──► Stage 2 ──► Stage 3 ──► Stage 4 ──► Stage 5
   │                       │
   │                       ▼
   │                    Stage 6 ──► Stage 7
   │                                   │
   │                                   ▼
   │                    Stage 8 ──► Stage 9 ──► Stage 10
   │                       │
   │                       ▼
   │                    Stage 11 ──► Stage 12 ──► Stage 13 ──► Stage 14
   │
   └──────────────────────────────────────────────────────────────────►
```

**Critical Path:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14

---

## Tech Stack Summary

| Category | Technology |
|----------|------------|
| Build Tool | Vite 5.x |
| Language | TypeScript 5.x |
| UI Framework | React 18.x |
| State Management | Zustand 4.x |
| Styling | Tailwind CSS 3.x |
| Rendering | WebGPU + WGSL |
| Icons | Lucide React |

---

## Estimated Timeline

| Phase | Stages | Duration |
|-------|--------|----------|
| Foundation | 1-3 | ~1 week |
| Rendering | 4-5 | ~1 week |
| Controls | 6-8 | ~1 week |
| Gizmos | 9-10 | ~1-2 weeks |
| UI | 11-12 | ~1 week |
| Polish | 13-14 | ~1 week |

**Total: 6-8 weeks** for a solo developer

---

## How to Use These PRPs

### For Implementation

1. Read the stage PRP completely before starting
2. Create all files listed in the "Files to Create/Modify" section
3. Implement according to the detailed specifications
4. Run all manual tests in the "Testing Requirements" section
5. Verify all acceptance criteria are met
6. Move to the next stage

### For AI-Assisted Development

Each PRP is optimized for AI implementation:
- Complete code examples for complex components
- Explicit type definitions and interfaces
- Clear file structure specifications
- Detailed shader code (WGSL)
- Specific testing steps

You can provide a stage PRP to an AI assistant with the instruction:
> "Implement Stage X according to this PRP. Follow all specifications exactly."

---

## Key Design Decisions

### Why WebGPU Only?
- Better performance for raytracing via compute shaders
- Cleaner API than WebGL
- Future-proof technology
- No fallback complexity

### Why Zustand?
- Minimal boilerplate
- Great TypeScript support
- Easy undo/redo middleware
- No React context overhead

### Why Path Tracing?
- Physically accurate lighting
- Simpler than hybrid approaches
- Progressive refinement works well interactively
- Better results than rasterization for this use case

### Why Custom Gizmos?
- Full control over appearance
- Consistent with raytraced scene
- No external dependencies
- Proper depth integration

---

## Quality Gates

Before marking any stage complete, verify:

- [ ] All acceptance criteria are checked
- [ ] All manual tests pass
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Code follows established patterns

---

## Future Stages (v1.1+)

After v1.0 completion, potential future stages include:

- **Stage 15:** Additional Primitives (cylinder, cone, plane)
- **Stage 16:** Mesh Import (.obj, .gltf)
- **Stage 17:** Texture Support
- **Stage 18:** HDRI Environment Maps
- **Stage 19:** Animation Timeline
- **Stage 20:** Collaborative Editing

---

*Document Version: 1.0*
*Created: December 2024*
