/**
 * Ports (contracts).
 *
 * Stable TypeScript interfaces/types used across modules:
 * - `Command` union: write contract (user intent)
 * - `KernelQueries`: read contract (snapshots)
 * - `KernelEvents`: notification contract (minimal events)
 */

export * from './commands';
export * from './queries';
export * from './events';


