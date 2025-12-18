# `src/` overview (v2 in-progress)

This repo is being migrated to **v2** (behavior-preserving refactor). For the high-level goals and guardrails, see:

- `prp/v2/base.md`
- `docs/architecture.md`

## Quick map

- `src/App.tsx`: top-level React app shell
- `src/main.tsx`: app bootstrap / entrypoint
- `src/components/`: UI components (React)
- `src/renderer/`: WebGPU renderer
- `src/store/`: current Zustand stores (v1-style state; will be migrated behind kernel contracts)
- `src/core/`: math + shared low-level utilities

## Testing

- `npm test -- --run`


