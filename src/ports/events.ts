export type KernelEvent =
  | { type: 'state.changed' }
  | { type: 'render.invalidated' }
  | { type: 'diagnostic'; message: string };

export type Unsubscribe = () => void;

/**
 * v2 eventing contract: minimal notifications only.
 *
 * Implementations must:
 * - deliver events in order
 * - support unsubscribe
 * - avoid turning events into a parallel state system
 */
export interface KernelEvents {
  subscribe(listener: (event: KernelEvent) => void): Unsubscribe;
}


