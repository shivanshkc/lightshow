# `@ports`

## Purpose

`@ports` defines the cross-module **contracts**:
- **Commands**: write intent (`Command`)
- **Queries**: read interface (`KernelQueries`)
- **Events**: notification interface (`KernelEvents`)

These types should be stable, serializable where appropriate, and dependency-free.

## Public API

- `Command`, `parseCommand`
- `KernelQueries`, `SceneSnapshot` (+ related snapshot types)
- `KernelEvents`, `KernelEvent`

Entry points:
- `src/ports/index.ts`
- `src/ports/commands.ts`
- `src/ports/queries.ts`
- `src/ports/events.ts`

## Testing

- Contract tests:
  - `src/__tests__/portsCommands.contract.test.ts`
  - `src/__tests__/portsQueries.contract.test.ts`
  - `src/__tests__/portsEvents.contract.test.ts`

Run:

```bash
npm test -- --run
```

## Extension points

- Add new commands by extending the `Command` union and updating `parseCommand`.
- Keep query surfaces coarse-grained (prefer snapshots over many tiny reads).


