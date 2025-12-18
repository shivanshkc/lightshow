/**
 * Kernel (application core).
 *
 * Owns state transitions and history, and exposes:
 * - `dispatch(Command)` for writes
 * - `queries` for reads
 * - `events` for notifications
 */

export * from './Kernel';


