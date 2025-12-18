import type { Command, KernelEvents, KernelEvent, KernelQueries, SceneSnapshot, Unsubscribe } from '@ports';

/**
 * Backing store interface for the Kernel shell.
 *
 * - In Step 3.1 tests we use a pure in-memory mock implementation.
 * - In Step 3.2 we will provide an adapter that bridges to the existing stores.
 *
 * IMPORTANT: This interface is internal to the kernel module (not a port).
 */
export interface KernelBackingStore {
  getSceneSnapshot(): SceneSnapshot;
  apply(command: Command): { stateChanged: boolean; renderInvalidated: boolean };
}

export interface Kernel {
  dispatch(command: Command): void;
  queries: KernelQueries;
  events: KernelEvents;
}

export class KernelShell implements Kernel {
  private listeners = new Set<(event: KernelEvent) => void>();

  public readonly queries: KernelQueries;
  public readonly events: KernelEvents;

  constructor(private readonly store: KernelBackingStore) {
    this.queries = {
      getSceneSnapshot: () => this.store.getSceneSnapshot(),
    };

    this.events = {
      subscribe: (listener) => this.subscribe(listener),
    };
  }

  dispatch(command: Command): void {
    const { stateChanged, renderInvalidated } = this.store.apply(command);
    if (!stateChanged) return;

    // Always notify state changes first so subscribers can update before any render reset.
    this.emit({ type: 'state.changed' });
    if (renderInvalidated) this.emit({ type: 'render.invalidated' });
  }

  private subscribe(listener: (event: KernelEvent) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: KernelEvent): void {
    for (const l of this.listeners) l(event);
  }
}


