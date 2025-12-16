import { StateCreator } from 'zustand';

const MAX_HISTORY = 30;

export type HistoryFields<T> = {
  past: T[];
  future: T[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

export type WithHistory<T> = T & HistoryFields<T>;

function getStateWithoutHistory<T extends object>(state: WithHistory<T>): T {
  const { past: _past, future: _future, undo: _undo, redo: _redo, canUndo: _canUndo, canRedo: _canRedo, ...rest } =
    state as any;
  return rest as T;
}

/**
 * Zustand middleware for undo/redo history tracking.
 * Stores snapshots of the state (excluding history fields) in `past` / `future`.
 */
export const historyMiddleware =
  <T extends object>(
    config: StateCreator<T, [], []>,
    options: { limit?: number } = {}
  ): StateCreator<WithHistory<T>, [], []> =>
  (set, get, api) => {
    const limit = options.limit ?? MAX_HISTORY;

    const historySet: typeof set = (partial, replace) => {
      const currentState = getStateWithoutHistory(get() as WithHistory<T>);
      set(
        (state) => ({
          ...(typeof partial === 'function'
            ? (partial as (s: WithHistory<T>) => Partial<WithHistory<T>>)(state as WithHistory<T>)
            : partial),
          past: [...(state as WithHistory<T>).past.slice(-limit + 1), currentState],
          future: [],
        }),
        replace
      );
    };

    const initialState = config(historySet, get as unknown as () => T, api);

    return {
      ...(initialState as T),
      past: [] as T[],
      future: [] as T[],

      undo: () => {
        const { past, future } = get() as WithHistory<T>;
        if (past.length === 0) return;
        const prev = past[past.length - 1];
        const current = getStateWithoutHistory(get() as WithHistory<T>);
        set({
          ...(prev as any),
          past: past.slice(0, -1),
          future: [current, ...future],
        } as any);
      },

      redo: () => {
        const { past, future } = get() as WithHistory<T>;
        if (future.length === 0) return;
        const next = future[0];
        const current = getStateWithoutHistory(get() as WithHistory<T>);
        set({
          ...(next as any),
          past: [...past, current],
          future: future.slice(1),
        } as any);
      },

      canUndo: () => (get() as WithHistory<T>).past.length > 0,
      canRedo: () => (get() as WithHistory<T>).future.length > 0,
    };
  };


