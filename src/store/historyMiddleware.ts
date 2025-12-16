import { StateCreator } from 'zustand';

const MAX_HISTORY = 30;

type HistoryFields<T> = {
  past: T[];
  future: T[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

function getStateWithoutHistory<T extends Record<string, unknown>>(
  state: T & Partial<HistoryFields<T>>
): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { past, future, undo, redo, canUndo, canRedo, ...rest } =
    state as T & HistoryFields<T>;
  return rest as T;
}

/**
 * Zustand middleware for undo/redo history tracking.
 * Stores snapshots of the state (excluding history fields) in `past` / `future`.
 */
export const historyMiddleware =
  <T extends Record<string, unknown>>(
    config: StateCreator<T, [], []>,
    options: { limit?: number } = {}
  ): StateCreator<T & HistoryFields<T>, [], []> =>
  (set, get, api) => {
    const limit = options.limit ?? MAX_HISTORY;

    const historySet: typeof set = (partial, replace) => {
      const currentState = getStateWithoutHistory(get() as T & HistoryFields<T>);
      set(
        (state) => ({
          ...(typeof partial === 'function'
            ? (partial as (s: T & HistoryFields<T>) => Partial<T & HistoryFields<T>>)(state)
            : partial),
          past: [
            ...(state as T & HistoryFields<T>).past.slice(-limit + 1),
            currentState,
          ],
          future: [],
        }),
        replace
      );
    };

    const initialState = config(historySet, get as unknown as () => T, api);

    return {
      ...initialState,
      past: [] as T[],
      future: [] as T[],

      undo: () => {
        const { past, future } = get() as T & HistoryFields<T>;
        if (past.length === 0) return;
        const prev = past[past.length - 1];
        const current = getStateWithoutHistory(get() as T & HistoryFields<T>);
        set({
          ...(prev as unknown as T & HistoryFields<T>),
          past: past.slice(0, -1),
          future: [current, ...future],
        });
      },

      redo: () => {
        const { past, future } = get() as T & HistoryFields<T>;
        if (future.length === 0) return;
        const next = future[0];
        const current = getStateWithoutHistory(get() as T & HistoryFields<T>);
        set({
          ...(next as unknown as T & HistoryFields<T>),
          past: [...past, current],
          future: future.slice(1),
        });
      },

      canUndo: () => (get() as T & HistoryFields<T>).past.length > 0,
      canRedo: () => (get() as T & HistoryFields<T>).future.length > 0,
    };
  };


