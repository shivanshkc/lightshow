import { describe, it, expect } from 'vitest';
import type { KernelEvents, KernelEvent } from '@ports';

function createTestEmitter(): {
  events: KernelEvents;
  emit: (event: KernelEvent) => void;
} {
  const listeners = new Set<(event: KernelEvent) => void>();
  return {
    events: {
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
    emit: (event) => {
      for (const l of listeners) l(event);
    },
  };
}

describe('ports/events contract', () => {
  it('delivers events in order', () => {
    const { events, emit } = createTestEmitter();
    const seen: string[] = [];

    events.subscribe((e) => seen.push(e.type));

    emit({ type: 'state.changed' });
    emit({ type: 'render.invalidated' });
    emit({ type: 'diagnostic', message: 'hello' });

    expect(seen).toEqual(['state.changed', 'render.invalidated', 'diagnostic']);
  });

  it('unsubscribe stops delivery', () => {
    const { events, emit } = createTestEmitter();
    const seen: string[] = [];

    const unsub = events.subscribe((e) => seen.push(e.type));
    emit({ type: 'state.changed' });
    unsub();
    emit({ type: 'render.invalidated' });

    expect(seen).toEqual(['state.changed']);
  });
});


