import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { historyMiddleware } from '../store/historyMiddleware';

describe('historyMiddleware', () => {
  type TestState = {
    count: number;
    increment: () => void;
  };

  const useTestStore = create<TestState & { past: TestState[]; future: TestState[]; undo: () => void; redo: () => void; canUndo: () => boolean; canRedo: () => boolean }>()(
    historyMiddleware<TestState>((set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }))
  );

  beforeEach(() => {
    // Reset only data fields; keep action functions intact
    useTestStore.setState({ count: 0, past: [], future: [] } as any);
  });

  it('tracks state changes in past', () => {
    useTestStore.getState().increment();
    expect(useTestStore.getState().past.length).toBe(1);
    expect((useTestStore.getState().past[0] as any).count).toBe(0);
  });

  it('undo restores previous state', () => {
    useTestStore.getState().increment();
    expect(useTestStore.getState().count).toBe(1);
    useTestStore.getState().undo();
    expect(useTestStore.getState().count).toBe(0);
  });

  it('redo re-applies undone change', () => {
    useTestStore.getState().increment();
    useTestStore.getState().undo();
    useTestStore.getState().redo();
    expect(useTestStore.getState().count).toBe(1);
  });

  it('new action clears future', () => {
    useTestStore.getState().increment();
    useTestStore.getState().undo();
    useTestStore.getState().increment();
    expect(useTestStore.getState().future.length).toBe(0);
  });

  it('limits history size', () => {
    for (let i = 0; i < 50; i++) {
      useTestStore.getState().increment();
    }
    expect(useTestStore.getState().past.length).toBeLessThanOrEqual(30);
  });
});


