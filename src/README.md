# `src/` overview (v2 in-progress)

This repo is being migrated to **v2** (behavior-preserving refactor). For the high-level goals and guardrails, see:

- `prp/v2/base.md`
- `docs/architecture.md`

## Quick map

- `src/App.tsx`: top-level React app shell
- `src/main.tsx`: app bootstrap / entrypoint
- `src/components/`: UI components (React)
- `src/ports/`: v2 contracts (commands/queries/events)
- `src/kernel/`: v2 kernel shell (state authority + history ownership)
- `src/adapters/`: adapters bridging ports to tech (React, DOM input, v1 stores)
- `src/renderer/`: WebGPU renderer (consumes injected deps; no store singletons)
- `src/store/`: legacy Zustand stores (v1). In v2, access should be via `src/adapters/v1/*` only.
- `src/core/`: math + shared low-level utilities (no app state)
- `src/bench/`: in-app benchmark bridge (only enabled by `?__bench=1`)

## Testing

- `npm test -- --run`


