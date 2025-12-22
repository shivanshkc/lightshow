import { describe, it, expect } from 'vitest';
import {
  createDefaultTransform,
  createDefaultMaterial,
  createDefaultSphere,
  createDefaultCuboid,
  createDefaultCylinder,
  createDefaultCone,
  createDefaultTorus,
  createDefaultCapsule,
  MATERIAL_TYPES,
  type SceneObject,
  type PrimitiveType,
  type MaterialType,
} from '../core/types';

describe('Transform', () => {
  describe('createDefaultTransform', () => {
    it('returns valid transform', () => {
      const transform = createDefaultTransform();
      
      expect(transform.position).toEqual([0, 0, 0]);
      expect(transform.rotation).toEqual([0, 0, 0]);
      expect(transform.scale).toEqual([1, 1, 1]);
    });

    it('position has 3 components', () => {
      const transform = createDefaultTransform();
      expect(transform.position.length).toBe(3);
    });

    it('rotation has 3 components', () => {
      const transform = createDefaultTransform();
      expect(transform.rotation.length).toBe(3);
    });

    it('scale has 3 components', () => {
      const transform = createDefaultTransform();
      expect(transform.scale.length).toBe(3);
    });
  });
});

describe('Material', () => {
  describe('createDefaultMaterial', () => {
    it('default material is plastic', () => {
      const mat = createDefaultMaterial();
      expect(mat.type).toBe('plastic');
    });

    it('default material has gray color', () => {
      const mat = createDefaultMaterial();
      expect(mat.color).toEqual([0.8, 0.8, 0.8]);
    });

    it('default material has IOR 1.5', () => {
      const mat = createDefaultMaterial();
      expect(mat.ior).toBe(1.5);
    });

    it('default material has intensity 5', () => {
      const mat = createDefaultMaterial();
      expect(mat.intensity).toBe(5.0);
    });

    it('color has 3 components', () => {
      const mat = createDefaultMaterial();
      expect(mat.color.length).toBe(3);
    });

    it('color components are in valid range [0, 1]', () => {
      const mat = createDefaultMaterial();
      
      for (const c of mat.color) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    });
  });
});

describe('Material Types', () => {
  it('MATERIAL_TYPES has all four types', () => {
    const types = MATERIAL_TYPES.map(t => t.value);
    expect(types).toContain('plastic');
    expect(types).toContain('metal');
    expect(types).toContain('glass');
    expect(types).toContain('light');
  });

  it('MATERIAL_TYPES has labels', () => {
    for (const type of MATERIAL_TYPES) {
      expect(type.label).toBeDefined();
      expect(type.label.length).toBeGreaterThan(0);
    }
  });
});

describe('SceneObject', () => {
  describe('createDefaultSphere', () => {
    it('has type sphere', () => {
      const sphere = createDefaultSphere();
      expect(sphere.type).toBe('sphere');
    });

    it('has default name', () => {
      const sphere = createDefaultSphere();
      expect(sphere.name).toBe('Sphere');
    });

    it('is visible by default', () => {
      const sphere = createDefaultSphere();
      expect(sphere.visible).toBe(true);
    });

    it('has transform', () => {
      const sphere = createDefaultSphere();
      expect(sphere.transform).toBeDefined();
      expect(sphere.transform.position).toBeDefined();
    });

    it('has material', () => {
      const sphere = createDefaultSphere();
      expect(sphere.material).toBeDefined();
      expect(sphere.material.color).toBeDefined();
    });
  });

  describe('createDefaultCuboid', () => {
    it('has type cuboid', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.type).toBe('cuboid');
    });

    it('has default name', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.name).toBe('Cuboid');
    });

    it('is visible by default', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.visible).toBe(true);
    });

    it('has transform', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.transform).toBeDefined();
    });

    it('has material', () => {
      const cuboid = createDefaultCuboid();
      expect(cuboid.material).toBeDefined();
    });
  });

  describe('createDefaultCylinder', () => {
    it('has type cylinder', () => {
      const cylinder = createDefaultCylinder();
      expect(cylinder.type).toBe('cylinder');
    });

    it('has default name', () => {
      const cylinder = createDefaultCylinder();
      expect(cylinder.name).toBe('Cylinder');
    });

    it('has default encoded scale', () => {
      const cylinder = createDefaultCylinder();
      expect(cylinder.transform.scale).toEqual([1, 1, 1]);
    });
  });

  describe('createDefaultCone', () => {
    it('has type cone', () => {
      const cone = createDefaultCone();
      expect(cone.type).toBe('cone');
    });

    it('has default name', () => {
      const cone = createDefaultCone();
      expect(cone.name).toBe('Cone');
    });

    it('has default encoded scale', () => {
      const cone = createDefaultCone();
      expect(cone.transform.scale).toEqual([1, 1, 1]);
    });
  });

  describe('createDefaultTorus', () => {
    it('has type torus', () => {
      const torus = createDefaultTorus();
      expect(torus.type).toBe('torus');
    });

    it('has default name', () => {
      const torus = createDefaultTorus();
      expect(torus.name).toBe('Torus');
    });

    it('has default encoded scale', () => {
      const torus = createDefaultTorus();
      expect(torus.transform.scale).toEqual([0.75, 0.25, 0.25]);
    });
  });

  describe('createDefaultCapsule', () => {
    it('has type capsule', () => {
      const capsule = createDefaultCapsule();
      expect(capsule.type).toBe('capsule');
    });

    it('has default name', () => {
      const capsule = createDefaultCapsule();
      expect(capsule.name).toBe('Capsule');
    });

    it('has default encoded scale', () => {
      const capsule = createDefaultCapsule();
      expect(capsule.transform.scale).toEqual([0.5, 1, 0.5]);
    });
  });
});

describe('Type Safety', () => {
  it('PrimitiveType includes all supported primitives', () => {
    const sphere: PrimitiveType = 'sphere';
    const cuboid: PrimitiveType = 'cuboid';
    const cylinder: PrimitiveType = 'cylinder';
    const cone: PrimitiveType = 'cone';
    const torus: PrimitiveType = 'torus';
    const capsule: PrimitiveType = 'capsule';
    
    expect(sphere).toBe('sphere');
    expect(cuboid).toBe('cuboid');
    expect(cylinder).toBe('cylinder');
    expect(cone).toBe('cone');
    expect(torus).toBe('torus');
    expect(capsule).toBe('capsule');
  });

  it('MaterialType is union of four types', () => {
    const plastic: MaterialType = 'plastic';
    const metal: MaterialType = 'metal';
    const glass: MaterialType = 'glass';
    const light: MaterialType = 'light';
    
    expect(plastic).toBe('plastic');
    expect(metal).toBe('metal');
    expect(glass).toBe('glass');
    expect(light).toBe('light');
  });

  it('SceneObject structure is correct', () => {
    const obj: SceneObject = {
      id: 'test-id',
      name: 'Test',
      type: 'sphere',
      transform: createDefaultTransform(),
      material: createDefaultMaterial(),
      visible: true,
    };
    
    expect(obj.id).toBe('test-id');
    expect(obj.type).toBe('sphere');
  });
});
