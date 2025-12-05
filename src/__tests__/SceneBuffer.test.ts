import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock WebGPU globals
vi.stubGlobal('GPUBufferUsage', {
  STORAGE: 0x0080,
  COPY_DST: 0x0008,
});

describe('SceneBuffer', () => {
  const mockBuffer = {
    destroy: vi.fn(),
  };
  
  const mockDevice = {
    createBuffer: vi.fn().mockReturnValue(mockBuffer),
    queue: {
      writeBuffer: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates separate header and objects buffers on construction', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    // Should create 2 buffers: header and objects
    expect(mockDevice.createBuffer).toHaveBeenCalledTimes(2);
  });

  it('uploads header and objects to separate buffers', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere',
        transform: {
          position: [1, 2, 3],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        material: {
          color: [1, 0, 0],
          roughness: 0.5,
          metallic: 0,
          transparency: 0,
          ior: 1.5,
          emission: 0,
          emissionColor: [1, 1, 1],
        },
        visible: true,
      },
    ]);
    
    // Should write to both header and objects buffers
    expect(mockDevice.queue.writeBuffer).toHaveBeenCalledTimes(2);
  });

  it('returns separate header and objects buffers', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    expect(buffer.getHeaderBuffer()).toBeDefined();
    expect(buffer.getObjectsBuffer()).toBeDefined();
  });

  it('writes correct object count to header', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    const objects = [
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere' as const,
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
      {
        id: '2',
        name: 'Cuboid',
        type: 'cuboid' as const,
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ];
    
    buffer.upload(objects);
    
    // First writeBuffer call is for header
    const headerCall = mockDevice.queue.writeBuffer.mock.calls[0];
    const headerData = headerCall[2] as Uint32Array;
    expect(headerData[0]).toBe(2);
  });

  it('writes sphere type as 0', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere',
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ]);
    
    // Second writeBuffer call is for objects
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    const uint32View = new Uint32Array(objectsData.buffer);
    expect(uint32View[3]).toBe(0); // objectType at index 3
  });

  it('writes cuboid type as 1', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Cuboid',
        type: 'cuboid',
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ]);
    
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    const uint32View = new Uint32Array(objectsData.buffer);
    expect(uint32View[3]).toBe(1);
  });

  it('writes position correctly', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere',
        transform: { position: [1.5, 2.5, 3.5] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ]);
    
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    expect(objectsData[0]).toBe(1.5);
    expect(objectsData[1]).toBe(2.5);
    expect(objectsData[2]).toBe(3.5);
  });

  it('writes scale correctly', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere',
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [2, 3, 4] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ]);
    
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    expect(objectsData[4]).toBe(2);
    expect(objectsData[5]).toBe(3);
    expect(objectsData[6]).toBe(4);
  });

  it('writes material color correctly', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere',
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [0.5, 0.6, 0.7] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ]);
    
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    // Material starts at offset 16
    expect(objectsData[16]).toBeCloseTo(0.5);
    expect(objectsData[17]).toBeCloseTo(0.6);
    expect(objectsData[18]).toBeCloseTo(0.7);
  });

  it('writes roughness correctly', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere',
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.8, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ]);
    
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    expect(objectsData[19]).toBeCloseTo(0.8);
  });

  it('writes metallic correctly', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere',
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.5, metallic: 0.9, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ]);
    
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    // metallic is at matOffset + 10 = 16 + 10 = 26
    expect(objectsData[26]).toBeCloseTo(0.9);
  });

  it('writes ior correctly', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Sphere',
        type: 'sphere',
        transform: { position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 1, 1] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.7, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
    ]);
    
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    // ior is at matOffset + 9 = 16 + 9 = 25
    expect(objectsData[25]).toBeCloseTo(1.7);
  });

  it('skips invisible objects', async () => {
    const { SceneBuffer } = await import('../core/SceneBuffer');
    const buffer = new SceneBuffer(mockDevice as unknown as GPUDevice);
    
    buffer.upload([
      {
        id: '1',
        name: 'Visible Sphere',
        type: 'sphere',
        transform: { position: [1, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [1, 0, 0] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: true,
      },
      {
        id: '2',
        name: 'Invisible Sphere',
        type: 'sphere',
        transform: { position: [2, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] },
        material: { color: [0, 1, 0] as [number, number, number], roughness: 0.5, metallic: 0, transparency: 0, ior: 1.5, emission: 0, emissionColor: [1, 1, 1] as [number, number, number] },
        visible: false,
      },
    ]);
    
    const objectsCall = mockDevice.queue.writeBuffer.mock.calls[1];
    const objectsData = objectsCall[2] as Float32Array;
    
    // First object should have position (1, 0, 0)
    expect(objectsData[0]).toBe(1);
    // Second object slot should be zeroed (invisible)
    const secondObjectOffset = 32; // 128 bytes / 4 = 32 floats per object
    expect(objectsData[secondObjectOffset]).toBe(0);
  });
});
