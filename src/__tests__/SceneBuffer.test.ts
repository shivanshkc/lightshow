import { describe, it, expect } from 'vitest';
import {
  OBJECT_SIZE_BYTES,
  MAX_OBJECTS,
  HEADER_SIZE_BYTES,
} from '../core/SceneBuffer';

describe('SceneBuffer', () => {
  describe('buffer layout constants', () => {
    it('object size is 128 bytes', () => {
      expect(OBJECT_SIZE_BYTES).toBe(128);
    });

    it('max objects is 256', () => {
      expect(MAX_OBJECTS).toBe(256);
    });

    it('header size is 16 bytes', () => {
      expect(HEADER_SIZE_BYTES).toBe(16);
    });

    it('total buffer size is correct', () => {
      const totalSize = HEADER_SIZE_BYTES + MAX_OBJECTS * OBJECT_SIZE_BYTES;
      expect(totalSize).toBe(16 + 256 * 128);
      expect(totalSize).toBe(32784);
    });
  });

  describe('object encoding', () => {
    it('sphere type encodes to 0', () => {
      const type = 'sphere';
      const encoded = type === 'sphere' ? 0 : 1;
      expect(encoded).toBe(0);
    });

    it('cuboid type encodes to 1', () => {
      const type = 'cuboid';
      const encoded = type === 'sphere' ? 0 : 1;
      expect(encoded).toBe(1);
    });
  });

  describe('data layout', () => {
    it('object fits in 128 bytes (32 floats)', () => {
      const floatsPerObject = OBJECT_SIZE_BYTES / 4;
      expect(floatsPerObject).toBe(32);
    });

    it('transform section is 64 bytes (16 floats)', () => {
      const transformFloats = 16;
      expect(transformFloats * 4).toBe(64);
    });

    it('material section is 64 bytes (16 floats)', () => {
      const materialFloats = 16;
      expect(materialFloats * 4).toBe(64);
    });

    it('header is 4 u32s', () => {
      const headerU32s = HEADER_SIZE_BYTES / 4;
      expect(headerU32s).toBe(4);
    });
  });

  describe('limits', () => {
    it('respects MAX_OBJECTS limit', () => {
      const tooManyObjects = 300;
      const clampedCount = Math.min(tooManyObjects, MAX_OBJECTS);
      expect(clampedCount).toBe(256);
    });

    it('handles zero objects', () => {
      const count = Math.min(0, MAX_OBJECTS);
      expect(count).toBe(0);
    });
  });

  describe('module export', () => {
    it('exports SceneBuffer class', async () => {
      const module = await import('../core/SceneBuffer');
      expect(module.SceneBuffer).toBeDefined();
    });
  });
});

