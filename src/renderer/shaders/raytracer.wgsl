// ============================================
// Bindings
// ============================================

struct CameraUniforms {
  inverseProjection: mat4x4<f32>,
  inverseView: mat4x4<f32>,
  position: vec3<f32>,
}

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;

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

// ============================================
// Primitive Intersection Functions
// ============================================

// Sphere intersection
// center: sphere center
// radius: sphere radius
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
// center: box center
// halfExtents: half-size in each dimension
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
// Scene (Hardcoded for Stage 2)
// ============================================

fn traceScene(ray: Ray) -> HitRecord {
  var closest: HitRecord;
  closest.hit = false;
  closest.t = 999999.0;
  
  // Hardcoded sphere at origin
  let sphere1 = intersectSphere(ray, vec3<f32>(0.0, 0.0, 0.0), 1.0);
  if (sphere1.hit && sphere1.t < closest.t) {
    closest = sphere1;
  }
  
  // Hardcoded sphere to the right
  let sphere2 = intersectSphere(ray, vec3<f32>(2.5, 0.0, -1.0), 1.0);
  if (sphere2.hit && sphere2.t < closest.t) {
    closest = sphere2;
  }
  
  // Hardcoded box to the left
  let box1 = intersectBox(ray, vec3<f32>(-2.5, 0.0, 0.0), vec3<f32>(0.75, 0.75, 0.75));
  if (box1.hit && box1.t < closest.t) {
    closest = box1;
  }
  
  // Ground plane (large flat box)
  let ground = intersectBox(ray, vec3<f32>(0.0, -1.5, 0.0), vec3<f32>(10.0, 0.5, 10.0));
  if (ground.hit && ground.t < closest.t) {
    closest = ground;
  }
  
  return closest;
}

// ============================================
// Shading
// ============================================

fn shade(hit: HitRecord, ray: Ray) -> vec3<f32> {
  if (!hit.hit) {
    // Sky gradient
    let t = 0.5 * (ray.direction.y + 1.0);
    return mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(0.5, 0.7, 1.0), t);
  }
  
  // Simple normal-based shading
  // Map normal from [-1,1] to [0,1] for visualization
  return hit.normal * 0.5 + 0.5;
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

