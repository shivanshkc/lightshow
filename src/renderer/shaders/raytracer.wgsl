// ============================================
// Constants
// ============================================

const PI: f32 = 3.14159265359;
const EPSILON: f32 = 0.001;
const MAX_FLOAT: f32 = 3.402823466e+38;

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
  objectType: u32,          // 0 = sphere, 1 = cuboid
  scale: vec3<f32>,
  _pad1: f32,
  rotation: vec3<f32>,
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
// Bindings
// ============================================

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<storage, read> sceneHeader: SceneHeader;
@group(0) @binding(3) var<storage, read> sceneObjects: array<SceneObject>;

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

// Cosine-weighted hemisphere sampling for diffuse surfaces
fn randomCosineHemisphere(state: ptr<function, u32>, normal: vec3<f32>) -> vec3<f32> {
  let r1 = randomFloat(state);
  let r2 = randomFloat(state);
  
  let phi = 2.0 * PI * r1;
  let cosTheta = sqrt(r2);
  let sinTheta = sqrt(1.0 - r2);
  
  // Create local coordinate system (tangent space)
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
  frontFace: bool,
}

struct HitResult {
  hit: bool,
  t: f32,
  position: vec3<f32>,
  normal: vec3<f32>,
  frontFace: bool,
  objectIndex: i32,
}

// ============================================
// Primitive Intersection Functions
// ============================================

fn intersectSphere(ray: Ray, center: vec3<f32>, radius: f32) -> HitRecord {
  var result: HitRecord;
  result.hit = false;
  
  let oc = ray.origin - center;
  let a = dot(ray.direction, ray.direction);
  let halfB = dot(oc, ray.direction);
  let c = dot(oc, oc) - radius * radius;
  let discriminant = halfB * halfB - a * c;
  
  if (discriminant < 0.0) {
    return result;
  }
  
  let sqrtD = sqrt(discriminant);
  var t = (-halfB - sqrtD) / a;
  
  if (t < EPSILON) {
    t = (-halfB + sqrtD) / a;
  }
  
  if (t < EPSILON) {
    return result;
  }
  
  result.hit = true;
  result.t = t;
  result.position = ray.origin + t * ray.direction;
  let outwardNormal = (result.position - center) / radius;
  result.frontFace = dot(ray.direction, outwardNormal) < 0.0;
  result.normal = select(-outwardNormal, outwardNormal, result.frontFace);
  
  return result;
}

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
  if (t < EPSILON) {
    t = tFar;
    if (t < EPSILON) {
      return result;
    }
  }
  
  result.hit = true;
  result.t = t;
  result.position = ray.origin + t * ray.direction;
  
  // Calculate normal - determine which face was hit
  let p = (result.position - center) / halfExtents;
  let absP = abs(p);
  
  if (absP.x > absP.y && absP.x > absP.z) {
    result.normal = vec3<f32>(sign(p.x), 0.0, 0.0);
  } else if (absP.y > absP.z) {
    result.normal = vec3<f32>(0.0, sign(p.y), 0.0);
  } else {
    result.normal = vec3<f32>(0.0, 0.0, sign(p.z));
  }
  
  result.frontFace = dot(ray.direction, result.normal) < 0.0;
  result.normal = select(-result.normal, result.normal, result.frontFace);
  
  return result;
}

// ============================================
// Rotation Matrix from Euler Angles
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
    cy * cz,                      cy * sz,                      -sy,
    sx * sy * cz - cx * sz,       sx * sy * sz + cx * cz,       sx * cy,
    cx * sy * cz + sx * sz,       cx * sy * sz - sx * cz,       cx * cy
  );
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
  closest.t = MAX_FLOAT;
  closest.objectIndex = -1;
  
  let objectCount = sceneHeader.objectCount;
  
  for (var i = 0u; i < objectCount; i++) {
    let obj = sceneObjects[i];
    
    // Build rotation matrix and its inverse (transpose for orthogonal matrix)
    let rotMat = rotationMatrix(obj.rotation);
    let invRotMat = transpose(rotMat);
    
    // Transform ray to object local space
    var localRay: Ray;
    localRay.origin = invRotMat * (ray.origin - obj.position);
    localRay.direction = invRotMat * ray.direction;
    
    var hit: HitRecord;
    
    if (obj.objectType == 0u) {
      // Sphere - use scale.x as radius (uniform scale)
      hit = intersectSphere(localRay, vec3<f32>(0.0), obj.scale.x);
    } else {
      // Cuboid - use scale as half-extents
      hit = intersectBox(localRay, vec3<f32>(0.0), obj.scale);
    }
    
    if (hit.hit && hit.t < closest.t) {
      closest.hit = true;
      closest.t = hit.t;
      closest.position = ray.origin + hit.t * ray.direction;
      closest.normal = normalize(rotMat * hit.normal);
      closest.frontFace = hit.frontFace;
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
  return skyColor * 0.5;  // Dim sky for better contrast
}

// ============================================
// Shading (Simple for now - will be upgraded with path tracing)
// ============================================

fn shade(hit: HitResult, ray: Ray) -> vec3<f32> {
  if (!hit.hit) {
    // Sky gradient
    return sampleSky(ray.direction);
  }
  
  let obj = sceneObjects[hit.objectIndex];
  
  // Simple directional lighting
  let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
  let NdotL = max(dot(hit.normal, lightDir), 0.0);
  
  // Ambient + diffuse
  let ambient = 0.2;
  let diffuse = NdotL * 0.8;
  
  var color = obj.color * (ambient + diffuse);
  
  // Add emission (emissive objects glow)
  if (obj.emission > 0.0) {
    color = color + obj.emissionColor * obj.emission;
  }
  
  return color;
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
  
  // Initialize random state (for future use)
  var rng = initRandom(globalId.xy, 0u);
  
  let ray = generateRay(pixelCoord + 0.5, resolution);  // +0.5 for pixel center
  let hit = traceScene(ray);
  let color = shade(hit, ray);
  
  textureStore(outputTexture, vec2<i32>(globalId.xy), vec4<f32>(color, 1.0));
}
