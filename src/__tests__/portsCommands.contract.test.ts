import { describe, it, expect } from 'vitest';
import type { Command } from '@ports';
import { parseCommand } from '@ports';

describe('ports/commands contract', () => {
  it('round-trips through JSON (serializable + stable shape)', () => {
    const cmd: Command = {
      v: 1,
      type: 'material.update',
      objectId: 'obj-1',
      material: { type: 'glass', ior: 1.52, color: [1, 1, 1] },
    };

    const json = JSON.stringify(cmd);
    const parsed = parseCommand(JSON.parse(json));

    expect(parsed).toEqual(cmd);
  });

  it('round-trips transform.update through JSON (stable patch shape)', () => {
    const cmd: Command = {
      v: 1,
      type: 'transform.update',
      objectId: 'obj-1',
      transform: {
        position: [1, 2, 3],
        rotation: [0.1, 0.2, 0.3],
        scale: [2, 2, 2],
      },
    };

    const json = JSON.stringify(cmd);
    const parsed = parseCommand(JSON.parse(json));

    expect(parsed).toEqual(cmd);
  });

  it('rejects unknown commands safely', () => {
    const unknown = { v: 1, type: 'not-a-real-command', foo: 'bar' };
    expect(parseCommand(unknown)).toBeNull();
  });

  it('rejects wrong versions safely', () => {
    const wrong = { v: 2, type: 'history.undo' };
    expect(parseCommand(wrong)).toBeNull();
  });

  it('accepts object.add for all supported primitives', () => {
    const primitives = ['sphere', 'cuboid', 'cylinder', 'cone', 'torus', 'capsule'] as const;

    for (const primitive of primitives) {
      const cmd: Command = { v: 1, type: 'object.add', primitive };
      const json = JSON.stringify(cmd);
      const parsed = parseCommand(JSON.parse(json));
      expect(parsed).toEqual(cmd);
    }
  });

  it('rejects object.add with unknown primitive safely', () => {
    const unknown = { v: 1, type: 'object.add', primitive: 'not-a-primitive' };
    expect(parseCommand(unknown)).toBeNull();
  });
});


