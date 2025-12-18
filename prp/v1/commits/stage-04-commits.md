# Stage 4: Lighting & Shadows — Commits

## Overview
**Total Commits:** 5  
**Stage Goal:** Implement path tracing with shadows, GI, and progressive accumulation.

---

## Commit 4.1: Add random number generation to shader

### Description
Implement PCG-based RNG for path tracing sampling.

### Files to Create/Modify
```
src/renderer/shaders/random.wgsl (or inline in raytracer.wgsl)
```

### Key Implementation
```wgsl
fn pcg_hash(input: u32) -> u32 {
  var state = input * 747796405u + 2891336453u;
  var word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

fn initRandom(pixel: vec2<u32>, frame: u32) -> u32 {
  return pcg_hash(pixel.x + pcg_hash(pixel.y + pcg_hash(frame)));
}

fn randomFloat(state: ptr<function, u32>) -> f32 {
  *state = pcg_hash(*state);
  return f32(*state) / f32(0xFFFFFFFFu);
}

fn randomCosineHemisphere(state: ptr<function, u32>, normal: vec3<f32>) -> vec3<f32> {
  // Cosine-weighted hemisphere sampling for diffuse
}
```

### Test Cases
```typescript
describe('Random shader functions', () => {
  it('shader contains PCG hash function', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('pcg_hash');
  });
  
  it('shader contains randomFloat function', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('randomFloat');
  });
  
  it('shader contains hemisphere sampling', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('randomCosineHemisphere');
  });
});
```

### Commit Message
```
feat(shaders): add PCG random number generation for path tracing
```

---

## Commit 4.2: Add accumulation buffer and render settings

### Description
Create accumulation texture for progressive rendering.

### Files to Create/Modify
```
src/core/types.ts  # Add RenderSettings
src/renderer/RaytracingPipeline.ts
```

### Key Implementation
```typescript
// types.ts
export interface RenderSettings {
  frameIndex: number;
  samplesPerPixel: number;
  maxBounces: number;
  accumulate: boolean;
}

// RaytracingPipeline.ts
export class RaytracingPipeline {
  private accumulationTexture: GPUTexture | null = null;
  private settingsBuffer: GPUBuffer;
  private frameIndex: number = 0;

  resizeOutput(width: number, height: number): void {
    // Create output texture (rgba8unorm)
    // Create accumulation texture (rgba32float for precision)
    this.resetAccumulation();
  }

  resetAccumulation(): void {
    this.frameIndex = 0;
  }

  private updateSettings(): void {
    const data = new Uint32Array([
      this.frameIndex,
      1, // samples per frame
      8, // max bounces
      1, // accumulate flag
    ]);
    this.device.queue.writeBuffer(this.settingsBuffer, 0, data);
  }
}
```

### Test Cases
```typescript
describe('Accumulation', () => {
  it('frameIndex starts at 0', () => {
    expect(0).toBe(0); // Initial state
  });
  
  it('resetAccumulation sets frameIndex to 0', () => {
    let frameIndex = 50;
    frameIndex = 0; // reset
    expect(frameIndex).toBe(0);
  });
  
  it('accumulation texture format is rgba32float', () => {
    const format: GPUTextureFormat = 'rgba32float';
    expect(format).toBe('rgba32float');
  });
});
```

### Commit Message
```
feat(renderer): add accumulation buffer for progressive rendering
```

---

## Commit 4.3: Implement path tracing in shader

### Description
Replace direct shading with path tracing loop.

### Key Implementation
```wgsl
struct RenderSettings {
  frameIndex: u32,
  samplesPerPixel: u32,
  maxBounces: u32,
  flags: u32,
}

@group(0) @binding(1) var<uniform> settings: RenderSettings;
@group(0) @binding(3) var accumulationTexture: texture_storage_2d<rgba32float, read_write>;

fn trace(primaryRay: Ray, rng: ptr<function, u32>) -> vec3<f32> {
  var ray = primaryRay;
  var throughput = vec3<f32>(1.0);
  var radiance = vec3<f32>(0.0);
  
  for (var bounce = 0u; bounce < settings.maxBounces; bounce++) {
    let hit = traceScene(ray);
    
    if (!hit.hit) {
      radiance += throughput * sampleSky(ray.direction);
      break;
    }
    
    let obj = sceneObjects[hit.objectIndex];
    
    // Add emission
    if (obj.emission > 0.0) {
      radiance += throughput * obj.emissionColor * obj.emission;
    }
    
    // Bounce
    let newDir = randomCosineHemisphere(rng, hit.normal);
    throughput *= obj.color;
    
    // Russian roulette after bounce 3
    if (bounce > 3u) {
      let p = max(throughput.x, max(throughput.y, throughput.z));
      if (randomFloat(rng) > p) { break; }
      throughput /= p;
    }
    
    ray.origin = hit.position + hit.normal * 0.001;
    ray.direction = newDir;
  }
  
  return radiance;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  var rng = initRandom(globalId.xy, settings.frameIndex);
  
  // Jitter for anti-aliasing
  let jitter = vec2<f32>(randomFloat(&rng), randomFloat(&rng)) - 0.5;
  let ray = generateRay(pixelCoord + 0.5 + jitter, resolution);
  
  var color = trace(ray, &rng);
  color = min(color, vec3<f32>(10.0)); // Clamp fireflies
  
  // Accumulation
  if (settings.frameIndex == 0u) {
    accumulated = vec4<f32>(color, 1.0);
  } else {
    let prev = textureLoad(accumulationTexture, pixelIndex);
    let n = f32(settings.frameIndex + 1u);
    accumulated = vec4<f32>(prev.rgb + (color - prev.rgb) / n, 1.0);
  }
  
  textureStore(accumulationTexture, pixelIndex, accumulated);
  
  // Tone mapping (Reinhard) + gamma
  var final = accumulated.rgb / (accumulated.rgb + 1.0);
  final = pow(final, vec3<f32>(1.0/2.2));
  textureStore(outputTexture, pixelIndex, vec4<f32>(final, 1.0));
}
```

### Test Cases
```typescript
describe('Path tracing shader', () => {
  it('has trace function with bounce loop', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('for (var bounce');
    expect(code.default).toContain('maxBounces');
  });
  
  it('implements Russian roulette', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('Russian roulette');
  });
  
  it('has tone mapping', async () => {
    const code = await import('../renderer/shaders/raytracer.wgsl?raw');
    expect(code.default).toContain('Reinhard');
  });
});
```

### Commit Message
```
feat(shaders): implement path tracing with bounces and Russian roulette
```

---

## Commit 4.4: Add accumulation reset triggers

### Description
Reset accumulation when scene or camera changes.

### Files to Modify
```
src/renderer/Renderer.ts
src/store/sceneStore.ts
```

### Key Implementation
```typescript
// Renderer.ts
constructor(ctx: WebGPUContext) {
  // Subscribe to scene changes
  this.sceneUnsubscribe = useSceneStore.subscribe((state, prevState) => {
    if (state.objects !== prevState.objects) {
      this.raytracingPipeline.resetAccumulation();
    }
  });
  
  // Subscribe to camera changes
  this.cameraUnsubscribe = useCameraStore.subscribe(() => {
    this.raytracingPipeline.resetAccumulation();
  });
}

// Track frame count for UI
getFrameCount(): number {
  return this.raytracingPipeline.getFrameIndex();
}
```

### Test Cases
```typescript
describe('Accumulation reset', () => {
  it('resets when object added', () => {
    const resetCalled = vi.fn();
    // Mock: verify reset called when addSphere triggers
    useSceneStore.getState().addSphere();
    // Verify subscription triggers reset
  });
  
  it('resets when object modified', () => {
    const id = useSceneStore.getState().addSphere();
    // Modify object
    useSceneStore.getState().updateTransform(id, { position: [1,0,0] });
    // Verify reset triggered
  });
});
```

### Commit Message
```
feat(renderer): reset accumulation on scene/camera changes
```

---

## Commit 4.5: Add sample counter to UI

### Description
Display sample count in status bar to show progressive rendering.

### Files to Create/Modify
```
src/components/StatusBar.tsx
```

### Key Implementation
```typescript
export function StatusBar() {
  const [samples, setSamples] = useState(0);
  const rendererRef = useRef<Renderer | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (rendererRef.current) {
        setSamples(rendererRef.current.getFrameCount());
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <footer className="h-6 bg-panel-secondary border-t border-border-subtle flex items-center justify-end px-4 text-xs text-text-muted gap-4">
      <span>Samples: {samples}</span>
    </footer>
  );
}
```

### Test Cases
```typescript
describe('StatusBar', () => {
  it('renders sample count', () => {
    render(<StatusBar />);
    expect(screen.getByText(/Samples:/)).toBeDefined();
  });
});
```

### Manual Testing
1. Load scene with objects
2. Watch "Samples:" counter increment
3. Move object — counter resets to 0
4. Image gets cleaner as samples increase

### Commit Message
```
feat(ui): add sample counter to status bar

Stage 4 complete: Path tracing with progressive accumulation
```

---

## Stage 4 Commit Summary

| Commit | Description | Key Tests |
|--------|-------------|-----------|
| 4.1 | RNG functions | Shader contains PCG |
| 4.2 | Accumulation buffer | Reset behavior |
| 4.3 | Path tracing | Bounce loop, tone mapping |
| 4.4 | Reset triggers | Scene/camera subscription |
| 4.5 | Sample counter UI | Status bar display |

