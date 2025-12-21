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
// Material Helper Functions
// ============================================

// Schlick's approximation for Fresnel reflectance
fn schlickReflectance(cosine: f32, refIdx: f32) -> f32 {
  var r0 = (1.0 - refIdx) / (1.0 + refIdx);
  r0 = r0 * r0;
  return r0 + (1.0 - r0) * pow(1.0 - cosine, 5.0);
}

// Refract a ray using Snell's law
// Returns (refracted direction, success flag)
fn refractRay(incident: vec3<f32>, normal: vec3<f32>, etaRatio: f32) -> vec3<f32> {
  let cosI = dot(-incident, normal);
  let sin2T = etaRatio * etaRatio * (1.0 - cosI * cosI);
  
  // Total internal reflection check
  if (sin2T > 1.0) {
    return reflect(incident, normal);
  }
  
  let cosT = sqrt(1.0 - sin2T);
  return etaRatio * incident + (etaRatio * cosI - cosT) * normal;
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
  materialType: u32,      // 0 = plastic, 1 = metal, 2 = glass, 3 = light
  ior: f32,               // Index of refraction (glass only)
  intensity: f32,         // Emission intensity (light only)
  _mat_pad2: vec2<f32>,
  _material_pad1: vec4<f32>,
  _material_pad2: vec4<f32>,
}

// Material type constants
const MAT_PLASTIC: u32 = 0u;
const MAT_METAL: u32 = 1u;
const MAT_GLASS: u32 = 2u;
const MAT_LIGHT: u32 = 3u;

// Object type constants (must match src/core/SceneBuffer.ts OBJECT_TYPE_MAP)
const OBJ_SPHERE: u32 = 0u;
const OBJ_CUBOID: u32 = 1u;
const OBJ_CYLINDER: u32 = 2u;
const OBJ_CONE: u32 = 3u;
const OBJ_CAPSULE: u32 = 4u;
const OBJ_TORUS: u32 = 5u;

// ============================================
// Render Settings
// ============================================

struct RenderSettings {
  frameIndex: u32,
  samplesPerPixel: u32,
  maxBounces: u32,
  flags: u32,  // bit 0: accumulate
  selectedObjectIndex: i32,  // -1 if none selected
  // 16-byte aligned padding + render settings extension space.
  // bgData.x packs RGB as 0xRRGGBB (8 bits per channel).
  bgData: vec3<u32>,
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

// Capped cylinder intersection (finite, solid).
// Cylinder is centered at origin, aligned to local +Y axis.
// Radius = r, cap planes at y = ±halfHeight.
fn intersectCylinderCapped(ray: Ray, radius: f32, halfHeight: f32) -> HitRecord {
  var result: HitRecord;
  result.hit = false;

  if (!(radius > 0.0) || !(halfHeight > 0.0)) {
    return result;
  }

  let r2 = radius * radius;
  var bestT: f32 = MAX_FLOAT;
  var bestN: vec3<f32> = vec3<f32>(0.0);

  // Side surface: x^2 + z^2 = r^2
  let a = ray.direction.x * ray.direction.x + ray.direction.z * ray.direction.z;
  let b = 2.0 * (ray.origin.x * ray.direction.x + ray.origin.z * ray.direction.z);
  let c = ray.origin.x * ray.origin.x + ray.origin.z * ray.origin.z - r2;

  if (abs(a) > 1e-12) {
    let disc = b * b - 4.0 * a * c;
    if (disc >= 0.0) {
      let s = sqrt(disc);
      let t0 = (-b - s) / (2.0 * a);
      let t1 = (-b + s) / (2.0 * a);

      // Check both roots (near may be outside y-range)
      for (var j = 0u; j < 2u; j++) {
        let t = select(t0, t1, j == 1u);
        if (t > 0.001 && t < bestT) {
          let y = ray.origin.y + t * ray.direction.y;
          if (y >= -halfHeight && y <= halfHeight) {
            let p = ray.origin + t * ray.direction;
            bestT = t;
            bestN = normalize(vec3<f32>(p.x, 0.0, p.z));
          }
        }
      }
    }
  }

  // Caps: y = ±halfHeight, radial <= r
  if (abs(ray.direction.y) > 1e-12) {
    // bottom cap y = -halfHeight, normal -Y
    {
      let t = (-halfHeight - ray.origin.y) / ray.direction.y;
      if (t > 0.001 && t < bestT) {
        let x = ray.origin.x + t * ray.direction.x;
        let z = ray.origin.z + t * ray.direction.z;
        if (x * x + z * z <= r2) {
          bestT = t;
          bestN = vec3<f32>(0.0, -1.0, 0.0);
        }
      }
    }
    // top cap y = +halfHeight, normal +Y
    {
      let t = (halfHeight - ray.origin.y) / ray.direction.y;
      if (t > 0.001 && t < bestT) {
        let x = ray.origin.x + t * ray.direction.x;
        let z = ray.origin.z + t * ray.direction.z;
        if (x * x + z * z <= r2) {
          bestT = t;
          bestN = vec3<f32>(0.0, 1.0, 0.0);
        }
      }
    }
  }

  if (bestT == MAX_FLOAT) {
    return result;
  }

  result.hit = true;
  result.t = bestT;
  result.position = ray.origin + bestT * ray.direction;
  result.normal = bestN;
  return result;
}

// Capped cone intersection (finite, solid).
// Cone is centered at origin, aligned to local +Y axis.
// Convention (PRP v3.2): base cap at y=-halfHeight with radius=baseRadius; apex at y=+halfHeight with radius=0.
fn intersectConeCapped(ray: Ray, baseRadius: f32, halfHeight: f32) -> HitRecord {
  var result: HitRecord;
  result.hit = false;

  if (!(baseRadius > 0.0) || !(halfHeight > 0.0)) {
    return result;
  }

  var bestT: f32 = MAX_FLOAT;
  var bestN: vec3<f32> = vec3<f32>(0.0);

  // Implicit: x^2 + z^2 - k^2 * (halfHeight - y)^2 = 0, where k = baseRadius / (2*halfHeight)
  let k = baseRadius / (2.0 * halfHeight);
  let k2 = k * k;
  let q0 = halfHeight - ray.origin.y;

  let a = (ray.direction.x * ray.direction.x + ray.direction.z * ray.direction.z) - k2 * (ray.direction.y * ray.direction.y);
  let b = 2.0 * (ray.origin.x * ray.direction.x + ray.origin.z * ray.direction.z) + 2.0 * k2 * q0 * ray.direction.y;
  let c = (ray.origin.x * ray.origin.x + ray.origin.z * ray.origin.z) - k2 * (q0 * q0);

  if (abs(a) > 1e-12) {
    let disc = b * b - 4.0 * a * c;
    if (disc >= 0.0) {
      let s = sqrt(disc);
      let t0 = (-b - s) / (2.0 * a);
      let t1 = (-b + s) / (2.0 * a);

      for (var j = 0u; j < 2u; j++) {
        let t = select(t0, t1, j == 1u);
        if (t > 0.001 && t < bestT) {
          let y = ray.origin.y + t * ray.direction.y;
          if (y >= -halfHeight && y <= halfHeight) {
            let p = ray.origin + t * ray.direction;
            // Gradient of F: (2x, 2*k^2*(halfHeight - y), 2z)
            let gy = k2 * (halfHeight - p.y);
            bestT = t;
            bestN = normalize(vec3<f32>(p.x, gy, p.z));
          }
        }
      }
    }
  } else if (abs(b) > 1e-12) {
    let t = -c / b;
    if (t > 0.001) {
      let y = ray.origin.y + t * ray.direction.y;
      if (y >= -halfHeight && y <= halfHeight) {
        let p = ray.origin + t * ray.direction;
        let gy = k2 * (halfHeight - p.y);
        bestT = t;
        bestN = normalize(vec3<f32>(p.x, gy, p.z));
      }
    }
  }

  // Base cap at y = -halfHeight with radius = baseRadius, normal -Y
  if (abs(ray.direction.y) > 1e-12) {
    let t = (-halfHeight - ray.origin.y) / ray.direction.y;
    if (t > 0.001 && t < bestT) {
      let x = ray.origin.x + t * ray.direction.x;
      let z = ray.origin.z + t * ray.direction.z;
      if (x * x + z * z <= baseRadius * baseRadius) {
        bestT = t;
        bestN = vec3<f32>(0.0, -1.0, 0.0);
      }
    }
  }

  if (bestT == MAX_FLOAT) {
    return result;
  }

  result.hit = true;
  result.t = bestT;
  result.position = ray.origin + bestT * ray.direction;
  result.normal = bestN;
  return result;
}

// Capsule intersection (solid): cylinder segment + hemispherical ends.
// Encoding: radius = scale.x, halfHeightTotal = scale.y; segmentHalf = max(halfHeightTotal - radius, 0).
fn intersectCapsule(ray: Ray, radius: f32, halfHeightTotal: f32) -> HitRecord {
  var result: HitRecord;
  result.hit = false;

  if (!(radius > 0.0) || !(halfHeightTotal > 0.0)) {
    return result;
  }

  let segmentHalf = max(halfHeightTotal - radius, 0.0);

  var best: HitRecord;
  best.hit = false;
  best.t = MAX_FLOAT;

  if (segmentHalf > 0.0) {
    let cyl = intersectCylinderCapped(ray, radius, segmentHalf);
    if (cyl.hit && cyl.t < best.t) {
      best = cyl;
    }
  }

  let top = intersectSphere(ray, vec3<f32>(0.0, segmentHalf, 0.0), radius);
  if (top.hit && top.t < best.t) {
    best = top;
  }

  let bottom = intersectSphere(ray, vec3<f32>(0.0, -segmentHalf, 0.0), radius);
  if (bottom.hit && bottom.t < best.t) {
    best = bottom;
  }

  return best;
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
    
    if (obj.objectType == OBJ_SPHERE) {
      // Sphere - scale.x is radius (uniform scale)
      hit = intersectSphere(localRay, vec3<f32>(0.0), obj.scale.x);
    } else if (obj.objectType == OBJ_CUBOID) {
      // Cuboid - scale is half-extents
      hit = intersectBox(localRay, vec3<f32>(0.0), obj.scale);
    } else if (obj.objectType == OBJ_CYLINDER) {
      hit = intersectCylinderCapped(localRay, obj.scale.x, obj.scale.y);
    } else if (obj.objectType == OBJ_CONE) {
      hit = intersectConeCapped(localRay, obj.scale.x, obj.scale.y);
    } else if (obj.objectType == OBJ_CAPSULE) {
      hit = intersectCapsule(localRay, obj.scale.x, obj.scale.y);
    } else {
      // Torus (and any unknown types) is handled in a later step. Deterministically "no hit".
      hit.hit = false;
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

fn unpackRgb8(packed: u32) -> vec3<f32> {
  let r = f32((packed >> 16u) & 255u) / 255.0;
  let g = f32((packed >> 8u) & 255u) / 255.0;
  let b = f32(packed & 255u) / 255.0;
  return vec3<f32>(r, g, b);
}

fn sampleSky(direction: vec3<f32>) -> vec3<f32> {
  _ = direction;
  // Solid background color (no gradient for now).
  return unpackRgb8(settings.bgData.x);
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
    var newDir: vec3<f32>;
    var newOrigin: vec3<f32>;
    
    // Handle material types
    switch obj.materialType {
      case MAT_LIGHT: {
        // Emissive material - add light and terminate
        radiance += throughput * obj.color * obj.intensity;
        return radiance;
      }
      
      case MAT_METAL: {
        // Perfect mirror reflection with color tinting
        newDir = reflect(ray.direction, hit.normal);
        throughput *= obj.color;
        newOrigin = hit.position + hit.normal * EPSILON;
      }
      
      case MAT_GLASS: {
        // Dielectric material with refraction
        let frontFace = dot(ray.direction, hit.normal) < 0.0;
        let surfaceNormal = select(-hit.normal, hit.normal, frontFace);
        let etaRatio = select(obj.ior, 1.0 / obj.ior, frontFace);
        
        let cosTheta = min(dot(-ray.direction, surfaceNormal), 1.0);
        let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
        
        // Check for total internal reflection
        let cannotRefract = etaRatio * sinTheta > 1.0;
        let reflectProb = schlickReflectance(cosTheta, etaRatio);
        
        if (cannotRefract || randomFloat(rng) < reflectProb) {
          // Reflect
          newDir = reflect(ray.direction, surfaceNormal);
          newOrigin = hit.position + surfaceNormal * EPSILON;
        } else {
          // Refract
          newDir = refractRay(ray.direction, surfaceNormal, etaRatio);
          newOrigin = hit.position - surfaceNormal * EPSILON;
        }
        
        // Glass is colorless by default, but can be tinted
        throughput *= obj.color;
      }
      
      case MAT_PLASTIC, default: {
        // Pure diffuse (Lambertian). Plastic is modeled as completely matte: no specular lobe.
        newDir = randomCosineHemisphere(rng, hit.normal);
        throughput *= obj.color;
        newOrigin = hit.position + hit.normal * EPSILON;
      }
    }
    
    // Russian roulette for path termination (after bounce 3)
    if (bounce > 3u) {
      let p = max(throughput.x, max(throughput.y, throughput.z));
      if (randomFloat(rng) > p) {
        break;
      }
      throughput /= p;
    }
    
    // Setup next ray
    ray.origin = newOrigin;
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
  // Use a stable (non-jittered) ray for selection highlight so it doesn't become noisy
  // when rendered as a display-only overlay.
  let highlightRay = generateRay(pixelCoord + 0.5, resolution);
  
  // Check if first hit is selected object (for highlight)
  let firstHit = traceScene(highlightRay);
  let isSelectedHit = firstHit.hit && firstHit.objectIndex == settings.selectedObjectIndex;
  
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

  // Apply selection highlight as a display-only overlay (not accumulated).
  if (isSelectedHit) {
    // Calculate rim factor based on viewing angle (Fresnel-like effect)
    let viewDir = -highlightRay.direction; // View direction is opposite of ray direction
    let rimFactor = 1.0 - abs(dot(viewDir, firstHit.normal));

    // Create bright rim glow that's stronger at edges
    let rimPower = pow(rimFactor, 2.5); // Sharper falloff for cleaner edge
    let rimColor = vec3<f32>(0.3, 0.7, 1.0); // Bright cyan-blue
    let rimGlow = rimColor * rimPower * 1.5;

    finalColor += rimGlow;
  }
  finalColor = finalColor / (finalColor + vec3<f32>(1.0));  // Reinhard tone mapping
  finalColor = pow(finalColor, vec3<f32>(1.0 / 2.2));       // Gamma correction
  
  textureStore(outputTexture, vec2<i32>(globalId.xy), vec4<f32>(finalColor, 1.0));
}
