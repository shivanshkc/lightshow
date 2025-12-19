# `@store`

## Purpose

Zustand stores hold interactive UI state and scene state used by the running app.

External modules should not import stores directly; store access should be routed through adapters.

## Key stores

- `src/store/sceneStore.ts`: scene objects + selection + environment
- `src/store/cameraStore.ts`: orbit camera state
- `src/store/gizmoStore.ts`: gizmo mode/hover/drag state

## Testing

- `src/__tests__/*Store.test.ts`

Run:

```bash
npm test -- --run
```


