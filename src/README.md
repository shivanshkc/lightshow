# `src/` overview

This folder contains the application source code. Start with:

- `docs/architecture.md`
- `docs/components.md`

## Quick map

- `src/App.tsx`: top-level React app shell
- `src/main.tsx`: app bootstrap / entrypoint
- `src/components/`: UI components (React)
- `src/ports/`: contracts (commands/queries/events)
- `src/kernel/`: application core (state authority + history ownership)
- `src/adapters/`: adapters bridging contracts to tech (React, DOM input, stores)
- `src/renderer/`: WebGPU renderer (consumes injected deps; no store singletons)
- `src/store/`: Zustand stores. Access from outside `src/store/` should be via adapters (see `src/adapters/zustand/*`).
- `src/core/`: math + shared low-level utilities (no app state)
- `src/bench/`: in-app benchmark bridge (only enabled by `?__bench=1`)

## Testing

- `npm test -- --run`


