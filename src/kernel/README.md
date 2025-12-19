# `@kernel`

## Purpose

The kernel is the application core. It is the single authority for:
- applying user intent (`dispatch(Command)`)
- maintaining undo/redo history and grouping
- exposing read-only state via queries
- emitting minimal events for UI/renderer synchronization

## Public API

- `KernelShell` (implements `Kernel`)
- `KernelBackingStore` (internal boundary the kernel uses to read/write scene state)

Entry points:
- `src/kernel/index.ts`
- `src/kernel/Kernel.ts`

## How it works (high-level)

- `dispatch(command)` applies commands through the backing store.
- For non-selection changes it emits:
  - `state.changed` always when state changes
  - `render.invalidated` only when accumulation must reset
- Undo/redo and transform grouping are owned by the kernel.

## Testing

- Contract tests:
  - `src/kernel/__tests__/KernelShell.contract.test.ts`
  - `src/__tests__/kernelHistory.contract.test.ts`
  - `src/__tests__/kernelHistoryGrouping.contract.test.ts`

Run:

```bash
npm test -- --run
```

## Extension points

- Swap backing store by constructing `KernelShell(new YourBackingStore())`.
- In React tests, inject a custom kernel via `KernelProvider kernel={...}`.


