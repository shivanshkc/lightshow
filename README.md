# Lightshow

A browser-based WebGPU raytracing application for creating and rendering 3D scenes with physically accurate lighting.

## Overview

Lightshow allows users to:
- Add primitive objects (spheres, cuboids) to a scene
- Transform objects using intuitive gizmos (translate, rotate, scale)
- Customize materials (color, roughness, metallic, transparency, emission)
- View real-time raytraced renders with global illumination
- Save/load scenes and export rendered images

## Technology

- **Rendering**: WebGPU with WGSL compute shaders
- **Frontend**: React 18 + TypeScript 5
- **Styling**: Tailwind CSS (dark theme)
- **State**: Zustand
- **Build**: Vite 5
- **Testing**: Vitest

## Project Documentation

This repository contains comprehensive development documentation:

| File | Description |
|------|-------------|
| `prp/execute.md` | AI execution prompt for automated development |
| `prp/master.md` | Product Requirements Prompt — full feature specification |
| `prp/stages/` | 14 detailed stage PRPs for incremental development |
| `prp/commits/` | 63 atomic commit specifications with tests |

### Documentation Structure

```
lightshow/
└── prp/
    ├── execute.md                    # AI execution instructions
    ├── master.md                     # Main product requirements
    ├── stages/
    │   ├── README.md                 # Stages overview
    │   ├── stage-01-project-setup.md # Project setup
    │   ├── stage-02-basic-raytracer.md # Basic raytracer
    │   └── ...                       # Stages 03-14
    └── commits/
        ├── README.md                 # Commits overview
        ├── stage-01-commits.md       # Stage 1 commits
        ├── stage-02-commits.md       # Stage 2 commits
        └── ...                       # Stages 03-14
```

## Development

### For AI-Assisted Development

To have an AI model build this project from scratch:

1. Provide the AI with access to this repository
2. Instruct it to read and follow `prp/execute.md`
3. The AI will implement all 63 commits across 14 stages

### For Manual Development

1. Read `prp/master.md` to understand the product
2. Follow stages in `prp/stages/` directory in order
3. Use commit specs in `prp/commits/` for atomic implementation

### Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

## Features (v1.0)

### Scene Management
- Add sphere and cuboid primitives
- Select, delete, duplicate objects
- Rename objects
- Toggle visibility

### Transformations
- Translation gizmo with axis/plane constraints
- Rotation gizmo with trackball
- Scale gizmo (uniform for spheres)
- Grid snapping (Ctrl key)

### Materials
- Base color picker
- Roughness (0 = mirror, 1 = matte)
- Metallic (0 = dielectric, 1 = metal)
- Transparency with IOR
- Emission with color

### Camera
- Orbit (left-drag)
- Pan (middle-drag or Shift+left)
- Zoom (scroll)
- Focus on selection (F key)
- Reset (Home key)

### Persistence
- Save/load scene (JSON)
- Export image (PNG)
- Auto-save with recovery

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| W / G | Translate mode |
| E | Rotate mode |
| R / S | Scale mode |
| Delete | Delete selected |
| Ctrl+D | Duplicate |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Escape | Deselect |
| F | Focus on selected |
| Home | Reset camera |

## Browser Requirements

WebGPU is required:
- Chrome 113+
- Edge 113+
- Safari 17+ (macOS/iOS)
- Firefox 130+ (with flag)

## License

MIT
