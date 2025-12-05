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
| `PRP.md` | Product Requirements Prompt — full feature specification |
| `EXECUTE.md` | AI execution prompt for automated development |
| `stages/` | 14 detailed stage PRPs for incremental development |
| `commits/` | 63 atomic commit specifications with tests |

### Documentation Structure

```
lightshow/
├── PRP.md                    # Main product requirements
├── EXECUTE.md                # AI execution instructions
├── stages/
│   ├── README.md             # Stages overview
│   ├── STAGE_01_*.md         # Project setup
│   ├── STAGE_02_*.md         # Basic raytracer
│   └── ...                   # Stages 03-14
└── commits/
    ├── README.md             # Commits overview
    ├── STAGE_01_COMMITS.md   # Stage 1 commits
    ├── STAGE_02_COMMITS.md   # Stage 2 commits
    └── ...                   # Stages 03-14
```

## Development

### For AI-Assisted Development

To have an AI model build this project from scratch:

1. Provide the AI with access to this repository
2. Instruct it to read and follow `EXECUTE.md`
3. The AI will implement all 63 commits across 14 stages

### For Manual Development

1. Read `PRP.md` to understand the product
2. Follow stages in `stages/` directory in order
3. Use commit specs in `commits/` for atomic implementation

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
