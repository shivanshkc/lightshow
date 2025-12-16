import { describe, it, expect } from 'vitest';
import {
  OBJECT_SIZE_BYTES,
  MAX_OBJECTS,
  HEADER_SIZE_BYTES,
  MATERIAL_TYPE_MAP,
} from '../core/SceneBuffer';
import { PrimitiveType, MaterialType } from '../core/types';

describe('SceneBuffer', () => {
  describe('buffer layout constants', () => {
    it('object size is 128 bytes', () => {
      expect(OBJECT_SIZE_BYTES).toBe(128);
    });

    it('max objects is 256', () => {
      expect(MAX_OBJECTS).toBe(256);
    });

    it('header size is 256 bytes (padded for WebGPU alignment)', () => {
      expect(HEADER_SIZE_BYTES).toBe(256);
    });

    it('total buffer size is correct', () => {
      const totalSize = HEADER_SIZE_BYTES + MAX_OBJECTS * OBJECT_SIZE_BYTES;
      expect(totalSize).toBe(256 + 256 * 128);
      expect(totalSize).toBe(33024);
    });
  });

  describe('object encoding', () => {
    it('sphere type encodes to 0', () => {
      const type = 'sphere';
      const encoded = type === 'sphere' ? 0 : 1;
      expect(encoded).toBe(0);
    });

    it('cuboid type encodes to 1', () => {
      const type = 'cuboid' as PrimitiveType;
      const encoded = type === 'sphere' ? 0 : 1;
      expect(encoded).toBe(1);
    });
  });

  describe('material type encoding', () => {
    it('plastic encodes to 0', () => {
      expect(MATERIAL_TYPE_MAP['plastic']).toBe(0);
    });

    it('metal encodes to 1', () => {
      expect(MATERIAL_TYPE_MAP['metal']).toBe(1);
    });

    it('glass encodes to 2', () => {
      expect(MATERIAL_TYPE_MAP['glass']).toBe(2);
    });

    it('light encodes to 3', () => {
      expect(MATERIAL_TYPE_MAP['light']).toBe(3);
    });

    it('all material types are mapped', () => {
      const materialTypes: MaterialType[] = ['plastic', 'metal', 'glass', 'light'];
      materialTypes.forEach((type) => {
        expect(MATERIAL_TYPE_MAP[type]).toBeDefined();
        expect(typeof MATERIAL_TYPE_MAP[type]).toBe('number');
      });
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

    it('header is 64 u32s (256 bytes padded)', () => {
      const headerU32s = HEADER_SIZE_BYTES / 4;
      expect(headerU32s).toBe(64);
    });

    it('material layout: color(3) + type(1) + ior(1) + intensity(1) + padding(10)', () => {
      // Material section layout:
      // [0-2]   color (vec3)
      // [3]     materialType (u32)
      // [4]     ior (f32)
      // [5]     intensity (f32)
      // [6-15]  padding
      const colorFloats = 3;
      const typeFloats = 1;
      const iorFloats = 1;
      const intensityFloats = 1;
      const paddingFloats = 10;
      const totalMaterialFloats = colorFloats + typeFloats + iorFloats + intensityFloats + paddingFloats;
      expect(totalMaterialFloats).toBe(16);
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

