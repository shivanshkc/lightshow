# Lightshow Commit Specifications

This directory contains detailed commit breakdowns for each development stage. Each commit is atomic, testable, and includes unit tests.

---

## Commit Overview

| Stage | Commits | Focus |
|-------|---------|-------|
| [Stage 01](./stage-01-commits.md) | 5 | Project setup, WebGPU init |
| [Stage 02](./stage-02-commits.md) | 6 | Basic raytracer |
| [Stage 03](./stage-03-commits.md) | 5 | Scene data pipeline |
| [Stage 04](./stage-04-commits.md) | 5 | Lighting & shadows |
| [Stage 05](./stage-05-commits.md) | 4 | Materials system |
| [Stage 06](./stage-06-commits.md) | 4 | Camera controls |
| [Stage 07](./stage-07-commits.md) | 5 | UI shell |
| [Stage 08](./stage-08-commits.md) | 4 | Object selection |
| [Stage 09](./stage-09-commits.md) | 5 | Translation gizmo |
| [Stage 10](./stage-10-commits.md) | 4 | Rotation & scale gizmos |
| [Stage 11](./stage-11-commits.md) | 4 | Properties panel |
| [Stage 12](./stage-12-commits.md) | 4 | Scene operations |
| [Stage 13](./stage-13-commits.md) | 4 | Polish & UX |
| [Stage 14](./stage-14-commits.md) | 4 | Export & persistence |

**Total: 63 commits**

---

## Commit Format

Each commit document follows this structure:

```markdown
## Commit X.Y: Title

### Description
Brief description of what this commit accomplishes.

### Files to Create/Modify
List of files with actions.

### Key Implementation
Code snippets showing core implementation.

### Test Cases
Unit tests for this commit.

### Manual Testing (if applicable)
Steps to verify visually.

### Commit Message
Conventional commit message format.
```

---

## Testing Philosophy

Every commit includes tests:

1. **Unit Tests** — Isolated function/component tests
2. **Integration Tests** — Store interactions, subscriptions
3. **Manual Tests** — Visual verification where applicable

### Test Stack
- **Vitest** — Test runner
- **React Testing Library** — Component tests
- **@vitest/ui** — Visual test runner (optional)

### Running Tests
```bash
npm test          # Run all tests
npm run test:ui   # Visual test runner
npm run test:coverage  # Coverage report
```

---

## Commit Naming Convention

```
<type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code restructure
- style: Formatting, styling
- test: Adding tests
- chore: Maintenance
- perf: Performance improvement
- docs: Documentation

Scopes:
- setup, core, store, renderer, shaders
- ui, components, panels, gizmos
- io, validation, keyboard, camera
```

---

## Development Workflow

### For Each Commit:

1. **Read** the commit specification completely
2. **Create** all listed files
3. **Implement** according to key implementation
4. **Write** the test cases
5. **Run** tests: `npm test`
6. **Verify** manually if applicable
7. **Commit** with the provided message

### Verification Checklist:

- [ ] All files created/modified as specified
- [ ] Tests pass (`npm test`)
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No console errors in browser
- [ ] Manual testing completed (if applicable)
- [ ] Commit message follows convention

---

## Quick Reference: All Commits

### Stage 1: Project Setup
- 1.1: Initialize Vite + React + TypeScript
- 1.2: Add Tailwind CSS configuration
- 1.3: Add WebGPU types and detection
- 1.4: Create Canvas component
- 1.5: Add basic render loop

### Stage 2: Basic Raytracer
- 2.1: Add math utilities
- 2.2: Create Camera class
- 2.3: Create raytracing compute shader
- 2.4: Create blit shader
- 2.5: Create RaytracingPipeline
- 2.6: Create BlitPipeline and integrate

### Stage 3: Scene Data Pipeline
- 3.1: Add Zustand and define scene types
- 3.2: Create scene store
- 3.3: Create SceneBuffer for GPU
- 3.4: Update raytracer shader for dynamic scene
- 3.5: Integrate scene store with renderer

### Stage 4: Lighting & Shadows
- 4.1: Add random number generation to shader
- 4.2: Add accumulation buffer
- 4.3: Implement path tracing
- 4.4: Add accumulation reset triggers
- 4.5: Add sample counter to UI

### Stage 5: Materials System
- 5.1: Add material types and presets
- 5.2: Update GPU buffer for material types
- 5.3: Implement material shaders
- 5.4: Integrate material system in trace loop

### Stage 6: Camera Controls
- 6.1: Create camera store
- 6.2: Create CameraController
- 6.3: Integrate camera with renderer
- 6.4: Add keyboard shortcuts

### Stage 7: UI Shell
- 7.1: Setup theme CSS variables
- 7.2: Create base UI components
- 7.3: Create layout structure
- 7.4: Create AddObjectSection
- 7.5: Create ObjectList

### Stage 8: Object Selection
- 8.1: Add ray intersection functions
- 8.2: Create Raycaster utility
- 8.3: Implement click-to-select
- 8.4: Add Escape to deselect

### Stage 9: Translation Gizmo
- 9.1: Create gizmo store
- 9.2: Generate gizmo geometry
- 9.3: Create GizmoRenderer
- 9.4: Implement drag logic
- 9.5: Integrate with Canvas

### Stage 10: Rotation & Scale Gizmos
- 10.1: Create rotation gizmo geometry
- 10.2: Create scale gizmo geometry
- 10.3: Implement rotation/scale logic
- 10.4: Add keyboard mode switching

### Stage 11: Properties Panel
- 11.1: Create NumberInput component
- 11.2: Create Slider, ColorPicker, and Select
- 11.3: Create TransformSection
- 11.4: Create MaterialSection with type selector

### Stage 12: Scene Operations
- 12.1: Add undo/redo middleware
- 12.2: Apply to sceneStore
- 12.3: Add keyboard shortcuts
- 12.4: Add renaming and action buttons

### Stage 13: Polish & UX
- 13.1: Polish gizmo visuals
- 13.2: Optimize render performance
- 13.3: Add input validation
- 13.4: Add error boundary

### Stage 14: Export & Persistence
- 14.1: Create scene serialization
- 14.2: Add file save/load
- 14.3: Add image export
- 14.4: Add auto-save and recovery

---

*Total Development: ~63 commits across 14 stages*
