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

  it('rejects unknown commands safely', () => {
    const unknown = { v: 1, type: 'not-a-real-command', foo: 'bar' };
    expect(parseCommand(unknown)).toBeNull();
  });

  it('rejects wrong versions safely', () => {
    const wrong = { v: 2, type: 'history.undo' };
    expect(parseCommand(wrong)).toBeNull();
  });
});


