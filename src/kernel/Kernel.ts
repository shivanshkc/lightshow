import type { Command, KernelEvents, KernelEvent, KernelQueries, SceneSnapshot, Unsubscribe, Vec3 } from '@ports';

export type KernelSceneState = {
  objects: SceneSnapshot['objects'];
  selectedObjectId: SceneSnapshot['selectedObjectId'];
  backgroundColor: Vec3;
};

/**
 * Backing store interface for the Kernel shell.
 *
 * - In Step 3.1 tests we use a pure in-memory mock implementation.
 * - In Step 3.2 we will provide an adapter that bridges to the existing stores.
 *
 * IMPORTANT: This interface is internal to the kernel module (not a port).
 */
export interface KernelBackingStore {
  getSceneState(): KernelSceneState;
  setSceneState(next: KernelSceneState): void;
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

  private past: KernelSceneState[] = [];
  private future: KernelSceneState[] = [];
  private group:
    | {
        label: 'transform';
        base: KernelSceneState;
        dirty: boolean;
      }
    | null = null;

  private lastSnapshot:
    | {
        objectsRef: unknown;
        selectedObjectId: string | null;
        backgroundRef: unknown;
        canUndo: boolean;
        canRedo: boolean;
        snapshot: SceneSnapshot;
      }
    | null = null;

  private static readonly MAX_HISTORY = 30;

  constructor(private readonly store: KernelBackingStore) {
    this.queries = {
      getSceneSnapshot: () => this.getSceneSnapshot(),
    };

    this.events = {
      subscribe: (listener) => this.subscribe(listener),
    };
  }

  dispatch(command: Command): void {
    // Grouping controls (continuous interactions).
    if (command.type === 'history.group.begin') {
      if (this.group) return;
      this.group = {
        label: command.label,
        base: this.cloneState(this.store.getSceneState()),
        dirty: false,
      };
      return;
    }

    if (command.type === 'history.group.end') {
      if (!this.group) return;
      const { base, dirty } = this.group;
      this.group = null;
      if (!dirty) return;

      // Commit one history step for the whole group.
      this.pushPast(base);
      this.future = [];
      this.invalidateSnapshotCache();
      this.emit({ type: 'state.changed' });
      return;
    }

    if (command.type === 'history.undo') {
      this.undo();
      return;
    }

    if (command.type === 'history.redo') {
      this.redo();
      return;
    }

    const prev = this.cloneState(this.store.getSceneState());
    const { stateChanged, renderInvalidated } = this.store.apply(command);
    if (!stateChanged) return;

    // Any new change clears redo.
    this.future = [];

    if (this.group) {
      this.group.dirty = true;
    } else {
      this.pushPast(prev);
    }

    this.invalidateSnapshotCache();
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

  private getSceneSnapshot(): SceneSnapshot {
    const s = this.store.getSceneState();
    const canUndo = this.past.length > 0;
    const canRedo = this.future.length > 0;

    const objectsRef = s.objects as unknown;
    const backgroundRef = s.backgroundColor as unknown;
    const selectedObjectId = s.selectedObjectId;

    if (
      this.lastSnapshot &&
      this.lastSnapshot.objectsRef === objectsRef &&
      this.lastSnapshot.selectedObjectId === selectedObjectId &&
      this.lastSnapshot.backgroundRef === backgroundRef &&
      this.lastSnapshot.canUndo === canUndo &&
      this.lastSnapshot.canRedo === canRedo
    ) {
      return this.lastSnapshot.snapshot;
    }

    const snapshot: SceneSnapshot = {
      objects: s.objects,
      selectedObjectId,
      backgroundColor: s.backgroundColor,
      history: { canUndo, canRedo },
    };

    this.lastSnapshot = { objectsRef, selectedObjectId, backgroundRef, canUndo, canRedo, snapshot };
    return snapshot;
  }

  private invalidateSnapshotCache(): void {
    this.lastSnapshot = null;
  }

  private pushPast(state: KernelSceneState): void {
    this.past = [...this.past.slice(-KernelShell.MAX_HISTORY + 1), state];
  }

  private cloneState(state: KernelSceneState): KernelSceneState {
    // We rely on structural sharing from store updates; shallow clone is enough for history snapshots.
    return {
      objects: state.objects,
      selectedObjectId: state.selectedObjectId,
      backgroundColor: state.backgroundColor,
    };
  }

  private shouldInvalidate(prev: KernelSceneState, next: KernelSceneState): boolean {
    if (prev.objects !== next.objects) return true;
    if (prev.backgroundColor !== next.backgroundColor) return true;
    return false;
  }

  private undo(): void {
    if (this.past.length === 0) return;
    const prevState = this.cloneState(this.store.getSceneState());
    const target = this.past[this.past.length - 1]!;
    this.past = this.past.slice(0, -1);
    this.future = [prevState, ...this.future];
    this.store.setSceneState(target);
    this.invalidateSnapshotCache();
    this.emit({ type: 'state.changed' });
    const nextState = this.store.getSceneState();
    if (this.shouldInvalidate(prevState, nextState)) this.emit({ type: 'render.invalidated' });
  }

  private redo(): void {
    if (this.future.length === 0) return;
    const prevState = this.cloneState(this.store.getSceneState());
    const target = this.future[0]!;
    this.future = this.future.slice(1);
    this.pushPast(prevState);
    this.store.setSceneState(target);
    this.invalidateSnapshotCache();
    this.emit({ type: 'state.changed' });
    const nextState = this.store.getSceneState();
    if (this.shouldInvalidate(prevState, nextState)) this.emit({ type: 'render.invalidated' });
  }
}


