# `@adapters`

## Purpose

Adapters connect contracts (`@ports`, `@kernel`) to concrete technologies:
- React UI wiring
- DOM input controllers
- Zustand-backed state
- Renderer dependency wiring

Adapters are where technology-specific details live (React, DOM, Zustand).

## Public API

The module entrypoint (`src/adapters/index.ts`) re-exports:
- React wiring: `KernelProvider`, `useKernel`, `useKernelSceneSnapshot`
- Input utilities: `DomKeyboardController`, `computeGizmoDragCommand`
- Zustand-backed adapters: `ZustandSceneBackingStore`, `createRendererDepsFromStores`, `createCanvasDepsFromStores`

## Composition root

- `KernelProvider` creates the default kernel and attaches keyboard input:
  - `src/adapters/react/KernelContext.tsx`
- `Canvas` creates the renderer and camera controller:
  - `src/components/Canvas.tsx`

## Testing

- Adapter tests:
  - `src/adapters/__tests__/ZustandSceneBackingStore.test.ts`
  - `src/adapters/input/__tests__/*`

Run:

```bash
npm test -- --run
```

## Extension points

- Swap the scene backing store by passing a different `Kernel` to `KernelProvider`.
- Add/replace input controllers by attaching a different controller in the same wiring locations.


