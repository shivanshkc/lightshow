// ============================================
// Constants
// ============================================

const PI: f32 = 3.14159265359;
const EPSILON: f32 = 0.001;
const MAX_FLOAT: f32 = 3.402823466e+38;

// ============================================
// Random Number Generation (PCG)
// ============================================

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

fn randomFloat2(state: ptr<function, u32>) -> vec2<f32> {
  return vec2<f32>(randomFloat(state), randomFloat(state));
}

// Cosine-weighted hemisphere sampling (for diffuse surfaces)
fn randomCosineHemisphere(state: ptr<function, u32>, normal: vec3<f32>) -> vec3<f32> {
  let r1 = randomFloat(state);
  let r2 = randomFloat(state);
  
  let phi = 2.0 * PI * r1;
  let cosTheta = sqrt(r2);
  let sinTheta = sqrt(1.0 - r2);
  
  // Create local coordinate system
  var tangent: vec3<f32>;
  if (abs(normal.x) > 0.9) {
    tangent = normalize(cross(vec3<f32>(0.0, 1.0, 0.0), normal));
  } else {
    tangent = normalize(cross(vec3<f32>(1.0, 0.0, 0.0), normal));
  }
  let bitangent = cross(normal, tangent);
  
  // Transform to world space
  return normalize(
    tangent * cos(phi) * sinTheta +
    bitangent * sin(phi) * sinTheta +
    normal * cosTheta
  );
}

// ============================================
// Camera Uniforms
// ============================================

struct CameraUniforms {
  inverseProjection: mat4x4<f32>,
  inverseView: mat4x4<f32>,
  position: vec3<f32>,
}

// ============================================
// Scene Data Structures
// ============================================

struct SceneHeader {
  objectCount: u32,
  _pad: vec3<u32>,
}

struct SceneObject {
  // Transform section (64 bytes)
  position: vec3<f32>,
  objectType: u32,        // 0 = sphere, 1 = cuboid
  scale: vec3<f32>,
  _pad1: f32,
  rotation: vec3<f32>,    // Euler angles
  _pad2: f32,
  _transform_pad: vec4<f32>,
  
  // Material section (64 bytes)
  color: vec3<f32>,
  roughness: f32,
  emissionColor: vec3<f32>,
  emission: f32,
  transparency: f32,
  ior: f32,
  metallic: f32,
  _mat_pad: f32,
  _material_pad: vec4<f32>,
}

// ============================================
// Render Settings
// ============================================

struct RenderSettings {
  frameIndex: u32,
  samplesPerPixel: u32,
  maxBounces: u32,
  flags: u32,  // bit 0: accumulate
}

// ============================================
// Accumulation Buffer
// ============================================

struct AccumulationData {
  r: f32,
  g: f32,
  b: f32,
  samples: f32,
}

// ============================================
// Bindings
// ============================================

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var<uniform> settings: RenderSettings;
@group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<storage, read_write> accumulationBuffer: array<AccumulationData>;
@group(0) @binding(4) var<storage, read> sceneHeader: SceneHeader;
@group(0) @binding(5) var<storage, read> sceneObjects: array<SceneObject>;

// ============================================
// Ray Structure
// ============================================

struct Ray {
  origin: vec3<f32>,
  direction: vec3<f32>,
}

// ============================================
// Intersection Structures
// ============================================

struct HitRecord {
  hit: bool,
  t: f32,
  position: vec3<f32>,
  normal: vec3<f32>,
}

struct HitResult {
  hit: bool,
  t: f32,
  position: vec3<f32>,
  normal: vec3<f32>,
  objectIndex: i32,
}

// ============================================
// Rotation Matrix from Euler Angles (ZYX order)
// ============================================

fn rotationMatrix(euler: vec3<f32>) -> mat3x3<f32> {
  let cx = cos(euler.x);
  let sx = sin(euler.x);
  let cy = cos(euler.y);
  let sy = sin(euler.y);
  let cz = cos(euler.z);
  let sz = sin(euler.z);
  
  // Combined rotation matrix (ZYX order)
  return mat3x3<f32>(
    cy * cz,                      cy * sz,                     -sy,
    sx * sy * cz - cx * sz,       sx * sy * sz + cx * cz,      sx * cy,
    cx * sy * cz + sx * sz,       cx * sy * sz - sx * cz,      cx * cy
  );
}

// ============================================
// Primitive Intersection Functions
// ============================================

// Sphere intersection (in object space, radius = 1)
fn intersectSphere(ray: Ray, center: vec3<f32>, radius: f32) -> HitRecord {
  var result: HitRecord;
  result.hit = false;
  
  let oc = ray.origin - center;
  let a = dot(ray.direction, ray.direction);
  let b = 2.0 * dot(oc, ray.direction);
  let c = dot(oc, oc) - radius * radius;
  let discriminant = b * b - 4.0 * a * c;
  
  if (discriminant < 0.0) {
    return result;
  }
  
  let sqrtD = sqrt(discriminant);
  var t = (-b - sqrtD) / (2.0 * a);
  
  if (t < 0.001) {
    t = (-b + sqrtD) / (2.0 * a);
  }
  
  if (t < 0.001) {
    return result;
  }
  
  result.hit = true;
  result.t = t;
  result.position = ray.origin + t * ray.direction;
  result.normal = normalize(result.position - center);
  
  return result;
}

// Box (cuboid) intersection using slab method
fn intersectBox(ray: Ray, center: vec3<f32>, halfExtents: vec3<f32>) -> HitRecord {
  var result: HitRecord;
  result.hit = false;
  
  let invDir = 1.0 / ray.direction;
  let t0 = (center - halfExtents - ray.origin) * invDir;
  let t1 = (center + halfExtents - ray.origin) * invDir;
  
  let tMin = min(t0, t1);
  let tMax = max(t0, t1);
  
  let tNear = max(max(tMin.x, tMin.y), tMin.z);
  let tFar = min(min(tMax.x, tMax.y), tMax.z);
  
  if (tNear > tFar || tFar < 0.0) {
    return result;
  }
  
  var t = tNear;
  if (t < 0.001) {
    t = tFar;
  }
  if (t < 0.001) {
    return result;
  }
  
  result.hit = true;
  result.t = t;
  result.position = ray.origin + t * ray.direction;
  
  // Calculate normal (which face was hit)
  let p = result.position - center;
  let d = halfExtents;
  
  result.normal = normalize(vec3<f32>(
    f32(abs(p.x) > d.x - 0.001) * sign(p.x),
    f32(abs(p.y) > d.y - 0.001) * sign(p.y),
    f32(abs(p.z) > d.z - 0.001) * sign(p.z)
  ));
  
  return result;
}

// ============================================
// Ray Generation
// ============================================

fn generateRay(pixelCoord: vec2<f32>, resolution: vec2<f32>) -> Ray {
  // Convert to NDC (-1 to 1)
  let ndc = vec2<f32>(
    (pixelCoord.x / resolution.x) * 2.0 - 1.0,
    1.0 - (pixelCoord.y / resolution.y) * 2.0  // Flip Y
  );
  
  // Unproject through inverse matrices
  var rayClip = vec4<f32>(ndc, -1.0, 1.0);
  var rayEye = camera.inverseProjection * rayClip;
  rayEye = vec4<f32>(rayEye.xy, -1.0, 0.0);
  
  let rayWorld = (camera.inverseView * rayEye).xyz;
  
  var ray: Ray;
  ray.origin = camera.position;
  ray.direction = normalize(rayWorld);
  
  return ray;
}

// ============================================
// Scene Tracing (Dynamic)
// ============================================

fn traceScene(ray: Ray) -> HitResult {
  var closest: HitResult;
  closest.hit = false;
  closest.t = 999999.0;
  closest.objectIndex = -1;
  
  let objectCount = sceneHeader.objectCount;
  
  for (var i = 0u; i < objectCount; i++) {
    let obj = sceneObjects[i];
    
    // Transform ray to object space (apply inverse rotation)
    let rotMat = rotationMatrix(obj.rotation);
    let invRotMat = transpose(rotMat);
    
    var localRay: Ray;
    localRay.origin = invRotMat * (ray.origin - obj.position);
    localRay.direction = invRotMat * ray.direction;
    
    var hit: HitRecord;
    
    if (obj.objectType == 0u) {
      // Sphere - scale.x is radius (uniform scale)
      hit = intersectSphere(localRay, vec3<f32>(0.0), obj.scale.x);
    } else {
      // Cuboid - scale is half-extents
      hit = intersectBox(localRay, vec3<f32>(0.0), obj.scale);
    }
    
    if (hit.hit && hit.t < closest.t) {
      closest.hit = true;
      closest.t = hit.t;
      closest.position = ray.origin + hit.t * ray.direction;
      // Transform normal back to world space
      closest.normal = normalize(rotMat * hit.normal);
      closest.objectIndex = i32(i);
    }
  }
  
  return closest;
}

// ============================================
// Sky/Environment
// ============================================

fn sampleSky(direction: vec3<f32>) -> vec3<f32> {
  let t = 0.5 * (direction.y + 1.0);
  let skyColor = mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(0.5, 0.7, 1.0), t);
  return skyColor * 0.5;  // Dim sky for better contrast with emissives
}

// ============================================
// Path Tracing
// ============================================

fn trace(primaryRay: Ray, rng: ptr<function, u32>) -> vec3<f32> {
  var ray = primaryRay;
  var throughput = vec3<f32>(1.0);
  var radiance = vec3<f32>(0.0);
  
  for (var bounce = 0u; bounce < settings.maxBounces; bounce++) {
    let hit = traceScene(ray);
    
    if (!hit.hit) {
      // Hit sky - add sky contribution and terminate
      radiance += throughput * sampleSky(ray.direction);
      break;
    }
    
    let obj = sceneObjects[hit.objectIndex];
    
    // Add emission from hit object
    if (obj.emission > 0.0) {
      radiance += throughput * obj.emissionColor * obj.emission;
    }
    
    // Handle transparency (simple pass-through)
    if (obj.transparency > 0.9 && randomFloat(rng) < obj.transparency) {
      ray.origin = hit.position + ray.direction * EPSILON;
      continue;
    }
    
    // Diffuse bounce direction (cosine-weighted hemisphere sampling)
    let diffuseDir = randomCosineHemisphere(rng, hit.normal);
    
    // Specular reflection direction
    let reflectDir = reflect(ray.direction, hit.normal);
    
    // Blend between diffuse and specular based on roughness
    // Low roughness = more specular, high roughness = more diffuse
    let isSpecular = randomFloat(rng) > obj.roughness;
    let newDir = select(diffuseDir, reflectDir, isSpecular);
    
    // Update throughput with material color
    throughput *= obj.color;
    
    // Russian roulette for path termination (after bounce 3)
    if (bounce > 3u) {
      let p = max(throughput.x, max(throughput.y, throughput.z));
      if (randomFloat(rng) > p) {
        break;
      }
      throughput /= p;
    }
    
    // Setup next ray
    ray.origin = hit.position + hit.normal * EPSILON;
    ray.direction = newDir;
  }
  
  return radiance;
}

// ============================================
// Main Compute Entry
// ============================================

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let resolution = vec2<f32>(textureDimensions(outputTexture));
  let pixelCoord = vec2<f32>(f32(globalId.x), f32(globalId.y));
  
  // Early exit if outside texture bounds
  if (pixelCoord.x >= resolution.x || pixelCoord.y >= resolution.y) {
    return;
  }
  
  // Calculate buffer index
  let width = u32(resolution.x);
  let bufferIndex = globalId.y * width + globalId.x;
  
  // Initialize random state from pixel position and frame index
  var rng = initRandom(globalId.xy, settings.frameIndex);
  
  // Jitter for anti-aliasing
  let jitter = randomFloat2(&rng) - 0.5;
  let ray = generateRay(pixelCoord + 0.5 + jitter, resolution);
  
  // Path trace
  var color = trace(ray, &rng);
  
  // Clamp fireflies (extremely bright pixels from low-probability paths)
  color = min(color, vec3<f32>(10.0));
  
  // Accumulation using buffer
  var accumulated: vec3<f32>;
  
  if (settings.frameIndex == 0u || (settings.flags & 1u) == 0u) {
    // First frame or accumulation disabled - just use current sample
    accumulated = color;
  } else {
    // Progressive accumulation using running average
    let prev = accumulationBuffer[bufferIndex];
    let previous = vec3<f32>(prev.r, prev.g, prev.b);
    let totalSamples = f32(settings.frameIndex + 1u);
    accumulated = previous + (color - previous) / totalSamples;
  }
  
  // Store accumulated color in buffer
  accumulationBuffer[bufferIndex] = AccumulationData(accumulated.r, accumulated.g, accumulated.b, 1.0);
  
  // Tone mapping (Reinhard) and gamma correction for output
  var finalColor = accumulated;
  finalColor = finalColor / (finalColor + vec3<f32>(1.0));  // Reinhard tone mapping
  finalColor = pow(finalColor, vec3<f32>(1.0 / 2.2));       // Gamma correction
  
  textureStore(outputTexture, vec2<i32>(globalId.xy), vec4<f32>(finalColor, 1.0));
}
