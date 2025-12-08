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
// Bindings
// ============================================

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<storage, read> sceneHeader: SceneHeader;
@group(0) @binding(3) var<storage, read> sceneObjects: array<SceneObject>;

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
// Shading with Object Colors
// ============================================

fn shade(hit: HitResult, ray: Ray) -> vec3<f32> {
  if (!hit.hit) {
    // Sky gradient
    let t = 0.5 * (ray.direction.y + 1.0);
    return mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(0.5, 0.7, 1.0), t);
  }
  
  let obj = sceneObjects[hit.objectIndex];
  
  // Simple diffuse shading with directional light
  let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
  let NdotL = max(dot(hit.normal, lightDir), 0.0);
  let ambient = 0.2;
  let diffuse = NdotL * 0.8;
  
  var color = obj.color * (ambient + diffuse);
  
  // Add emission
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
  
  let ray = generateRay(pixelCoord + 0.5, resolution);  // +0.5 for pixel center
  let hit = traceScene(ray);
  let color = shade(hit, ray);
  
  textureStore(outputTexture, vec2<i32>(globalId.xy), vec4<f32>(color, 1.0));
}
