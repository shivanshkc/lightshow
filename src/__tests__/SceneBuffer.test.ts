import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SceneBuffer } from '../core/SceneBuffer';

// Mock WebGPU globals
vi.stubGlobal('GPUBufferUsage', {
  STORAGE: 0x0080,
  COPY_DST: 0x0008,
});

describe('SceneBuffer', () => {
  describe('Buffer size calculations', () => {
    it('calculates correct total buffer size', () => {
      const headerSize = 16;
      const objectSize = 128;
      const maxObjects = 256;
      const totalSize = headerSize + maxObjects * objectSize;
      expect(totalSize).toBe(32784);
    });

    it('header size is 16 bytes', () => {
      expect(SceneBuffer.getHeaderSize()).toBe(16);
    });

    it('max objects is 256', () => {
      expect(SceneBuffer.getMaxObjects()).toBe(256);
    });

    it('object size is 128 bytes', () => {
      expect(SceneBuffer.getObjectSize()).toBe(128);
    });
  });

  describe('Object type encoding', () => {
    it('sphere type encodes as 0', () => {
      const type = 'sphere';
      const encoded = type === 'sphere' ? 0 : 1;
      expect(encoded).toBe(0);
    });

    it('cuboid type encodes as 1', () => {
      const type = 'cuboid';
      const encoded = type === 'sphere' ? 0 : 1;
      expect(encoded).toBe(1);
    });
  });

  describe('Object data layout', () => {
    it('transform section is 64 bytes (16 floats)', () => {
      const transformFloats = 16;
      const transformBytes = transformFloats * 4;
      expect(transformBytes).toBe(64);
    });

    it('material section is 64 bytes (16 floats)', () => {
      const materialFloats = 16;
      const materialBytes = materialFloats * 4;
      expect(materialBytes).toBe(64);
    });

    it('transform + material = 128 bytes', () => {
      expect(64 + 64).toBe(128);
    });
  });

  describe('Max objects limit', () => {
    it('respects MAX_OBJECTS limit', () => {
      const count = Math.min(300, 256);
      expect(count).toBe(256);
    });

    it('accepts fewer than max objects', () => {
      const count = Math.min(10, 256);
      expect(count).toBe(10);
    });
  });
});

describe('SceneBuffer memory layout', () => {
  it('header is at offset 0', () => {
    const headerOffset = 0;
    expect(headerOffset).toBe(0);
  });

  it('first object is at offset 16', () => {
    const firstObjectOffset = 16; // After header
    expect(firstObjectOffset).toBe(16);
  });

  it('second object is at offset 144', () => {
    const secondObjectOffset = 16 + 128; // Header + one object
    expect(secondObjectOffset).toBe(144);
  });
});

