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

// ============================================
// Mesh Tracing Data Structures (Step 06 plumbing)
// ============================================

struct MeshSceneHeader {
  instanceCount: u32,
  meshCount: u32,
  _pad: vec2<u32>,
}

struct MeshMeta {
  vertexOffset: u32,
  vertexCount: u32,
  indexOffset: u32,
  indexCount: u32,
  nodeOffset: u32,
  nodeCount: u32,
  _pad: vec2<u32>,
}

struct MeshVertex {
  position: vec4<f32>,
  normal: vec4<f32>,
}

// BVH node layout matches CPU packing in src/renderer/meshLibrary.ts (48 bytes).
struct BlasNode {
  aabbMin: vec3<f32>,
  left: i32,
  aabbMax: vec3<f32>,
  right: i32,
  triIndexOffset: u32,
  triCount: u32,
  _pad: vec2<u32>,
}

// Instance layout matches CPU packing in RaytracingPipeline.uploadMeshInstances (128 bytes).
struct MeshInstance {
  // Transform section (64 bytes)
  position: vec3<f32>,
  meshId: u32,
  scale: vec3<f32>,
  _pad0: f32,
  rotation: vec3<f32>,
  _pad1: f32,
  _transform_pad: vec4<f32>,

  // Material section (32 bytes + padding)
  color: vec3<f32>,
  materialType: u32,
  ior: f32,
  intensity: f32,
  _mat_pad: vec2<f32>,

  // Instance bounds (32 bytes)
  aabbMin: vec3<f32>,
  _pad2: f32,
  aabbMax: vec3<f32>,
  _pad3: f32,
}

// Material type constants
const MAT_PLASTIC: u32 = 0u;
const MAT_METAL: u32 = 1u;
const MAT_GLASS: u32 = 2u;
const MAT_LIGHT: u32 = 3u;

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

// Mesh tracing bindings (not used by traceScene yet; Step 06 plumbing only)
// NOTE: This is a uniform (not storage) to stay under maxStorageBuffersPerShaderStage on more GPUs.
@group(0) @binding(6) var<uniform> meshSceneHeader: MeshSceneHeader;
@group(0) @binding(7) var<storage, read> meshMeta: array<MeshMeta>;
@group(0) @binding(8) var<storage, read> meshVertices: array<MeshVertex>;
@group(0) @binding(9) var<storage, read> meshIndices: array<u32>;
@group(0) @binding(10) var<storage, read> meshBlasNodes: array<BlasNode>;
@group(0) @binding(11) var<storage, read> meshInstances: array<MeshInstance>;

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
// AABB intersection (for BLAS traversal)
// ============================================

struct AabbHit {
  hit: bool,
  tMin: f32,
  tMax: f32,
}

fn intersectAabb(ray: Ray, aabbMin: vec3<f32>, aabbMax: vec3<f32>) -> AabbHit {
  var out: AabbHit;
  out.hit = false;
  out.tMin = 0.0;
  out.tMax = 0.0;

  let invDir = 1.0 / ray.direction;
  let t0 = (aabbMin - ray.origin) * invDir;
  let t1 = (aabbMax - ray.origin) * invDir;

  let tMin3 = min(t0, t1);
  let tMax3 = max(t0, t1);

  let tMin = max(max(tMin3.x, tMin3.y), tMin3.z);
  let tMax = min(min(tMax3.x, tMax3.y), tMax3.z);

  if (tMax >= max(tMin, 0.0)) {
    out.hit = true;
    out.tMin = tMin;
    out.tMax = tMax;
  }
  return out;
}

// ============================================
// BLAS traversal (mesh intersection)
// ============================================

struct TriHit {
  hit: bool,
  t: f32,
  u: f32,
  v: f32,
}

fn intersectTriangleDetailed(ray: Ray, v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>) -> TriHit {
  var out: TriHit;
  out.hit = false;

  let e1 = v1 - v0;
  let e2 = v2 - v0;
  let p = cross(ray.direction, e2);
  let det = dot(e1, p);

  // Two-sided to support rays entering/exiting closed solids (e.g., glass).
  if (abs(det) < 1e-8) {
    return out;
  }

  let invDet = 1.0 / det;
  let tvec = ray.origin - v0;
  let u = dot(tvec, p) * invDet;
  if (u < 0.0 || u > 1.0) {
    return out;
  }

  let q = cross(tvec, e1);
  let v = dot(ray.direction, q) * invDet;
  if (v < 0.0 || u + v > 1.0) {
    return out;
  }

  let t = dot(e2, q) * invDet;
  if (t < 0.001) {
    return out;
  }

  out.hit = true;
  out.t = t;
  out.u = u;
  out.v = v;
  return out;
}

fn intersectMeshBlas(rayLocal: Ray, meshId: u32) -> HitRecord {
  var closest: HitRecord;
  closest.hit = false;
  closest.t = 999999.0;

  if (meshId >= meshSceneHeader.meshCount) {
    return closest;
  }

  let m = meshMeta[meshId];
  if (m.nodeCount == 0u) {
    return closest;
  }

  // Iterative traversal with an explicit stack + near-first ordering.
  // Root node index is m.nodeOffset + 0.
  const STACK_MAX: i32 = 64;
  var stackIdx: array<i32, 64>;
  var stackTMin: array<f32, 64>;
  var stackTMax: array<f32, 64>;
  var sp: i32 = 0;

  // Intersect root AABB once and carry tMin/tMax through the traversal stack to
  // avoid re-testing AABBs when popping nodes.
  let rootIndex = i32(m.nodeOffset);
  let rootNode = meshBlasNodes[u32(rootIndex)];
  let rootHit = intersectAabb(rayLocal, rootNode.aabbMin, rootNode.aabbMax);
  if (!rootHit.hit) {
    return closest;
  }
  stackIdx[0] = rootIndex;
  stackTMin[0] = rootHit.tMin;
  stackTMax[0] = rootHit.tMax;

  // Track best barycentrics so we can interpolate normal.
  var bestU: f32 = 0.0;
  var bestV: f32 = 0.0;
  var bestI0: u32 = 0u;
  var bestI1: u32 = 0u;
  var bestI2: u32 = 0u;

  loop {
    if (sp < 0) { break; }
    let nodeIndex = stackIdx[sp];
    let nodeTMin = stackTMin[sp];
    let nodeTMax = stackTMax[sp];
    sp -= 1;

    // Closest-hit pruning: if we already have a hit, skip nodes that start beyond it.
    if (closest.hit && nodeTMin > closest.t) {
      continue;
    }

    let node = meshBlasNodes[u32(nodeIndex)];
    // Note: node AABB was already tested at push-time; nodeTMin/nodeTMax are valid here.
    // Optional far bound pruning (rarely helps, but is cheap).
    if (closest.hit && nodeTMax < 0.0) {
      continue;
    }

    // Leaf
    if (node.left < 0) {
      let triCount = node.triCount;
      let base = node.triIndexOffset;
      for (var t = 0u; t < triCount; t++) {
        let i0 = meshIndices[base + t * 3u + 0u];
        let i1 = meshIndices[base + t * 3u + 1u];
        let i2 = meshIndices[base + t * 3u + 2u];

        let v0 = meshVertices[i0].position.xyz;
        let v1 = meshVertices[i1].position.xyz;
        let v2 = meshVertices[i2].position.xyz;

        let hit = intersectTriangleDetailed(rayLocal, v0, v1, v2);
        if (hit.hit && hit.t < closest.t) {
          closest.hit = true;
          closest.t = hit.t;
          bestU = hit.u;
          bestV = hit.v;
          bestI0 = i0;
          bestI1 = i1;
          bestI2 = i2;
        }
      }
      continue;
    }

    // Interior: near-first ordering using child AABB tMin.
    // We compute child AABB hits to:
    // - avoid pushing misses
    // - push nearer child last (LIFO) so it is processed first
    let leftNode = meshBlasNodes[u32(node.left)];
    let rightNode = meshBlasNodes[u32(node.right)];

    let leftHit = intersectAabb(rayLocal, leftNode.aabbMin, leftNode.aabbMax);
    let rightHit = intersectAabb(rayLocal, rightNode.aabbMin, rightNode.aabbMax);

    // Apply closest-hit pruning at child level (WGSL 'let' is immutable, so use flags).
    var leftOk = leftHit.hit;
    var rightOk = rightHit.hit;
    if (closest.hit) {
      if (leftOk && leftHit.tMin > closest.t) { leftOk = false; }
      if (rightOk && rightHit.tMin > closest.t) { rightOk = false; }
    }

    let needed = i32(leftOk) + i32(rightOk);
    if (needed == 0) {
      continue;
    }
    if (sp + needed >= STACK_MAX) {
      // Stack overflow: stop traversal and return best-so-far.
      break;
    }

    if (leftOk && rightOk) {
      let leftNear = leftHit.tMin <= rightHit.tMin;
      // Push farther first
      sp += 1;
      stackIdx[sp] = select(node.left, node.right, leftNear);
      stackTMin[sp] = select(leftHit.tMin, rightHit.tMin, leftNear);
      stackTMax[sp] = select(leftHit.tMax, rightHit.tMax, leftNear);
      sp += 1;
      stackIdx[sp] = select(node.right, node.left, leftNear);
      stackTMin[sp] = select(rightHit.tMin, leftHit.tMin, leftNear);
      stackTMax[sp] = select(rightHit.tMax, leftHit.tMax, leftNear);
    } else if (leftOk) {
      sp += 1;
      stackIdx[sp] = node.left;
      stackTMin[sp] = leftHit.tMin;
      stackTMax[sp] = leftHit.tMax;
    } else {
      sp += 1;
      stackIdx[sp] = node.right;
      stackTMin[sp] = rightHit.tMin;
      stackTMax[sp] = rightHit.tMax;
    }
  }

  if (!closest.hit) {
    return closest;
  }

  // Fill local-space position/normal for later steps (even if unused now).
  closest.position = rayLocal.origin + closest.t * rayLocal.direction;

  let w = 1.0 - bestU - bestV;
  let n0 = meshVertices[bestI0].normal.xyz;
  let n1 = meshVertices[bestI1].normal.xyz;
  let n2 = meshVertices[bestI2].normal.xyz;
  var n = normalize(w * n0 + bestU * n1 + bestV * n2);
  // Ensure normal is consistently oriented against the incoming ray direction so
  // frontFace tests (dot(ray.dir, normal) < 0) behave correctly for glass/metal.
  n = select(-n, n, dot(rayLocal.direction, n) < 0.0);
  closest.normal = n;

  return closest;
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

// Triangle intersection (Möller–Trumbore).
// Returns a HitRecord with position/normal unset by default; caller can fill if needed.
// Assumes triangles are single-sided with consistent winding for closed meshes.
fn intersectTriangle(ray: Ray, v0: vec3<f32>, v1: vec3<f32>, v2: vec3<f32>) -> HitRecord {
  var result: HitRecord;
  result.hit = false;

  let e1 = v1 - v0;
  let e2 = v2 - v0;
  let p = cross(ray.direction, e2);
  let det = dot(e1, p);

  // Reject near-parallel rays (and implicitly backfaces for single-sided triangles).
  // Note: for future two-sided support, we can use abs(det) and handle sign.
  if (det < 1e-8) {
    return result;
  }

  let invDet = 1.0 / det;
  let tvec = ray.origin - v0;
  let u = dot(tvec, p) * invDet;
  if (u < 0.0 || u > 1.0) {
    return result;
  }

  let q = cross(tvec, e1);
  let v = dot(ray.direction, q) * invDet;
  if (v < 0.0 || u + v > 1.0) {
    return result;
  }

  let t = dot(e2, q) * invDet;
  if (t < 0.001) {
    return result;
  }

  result.hit = true;
  result.t = t;
  return result;
}

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

  let instanceCount = meshSceneHeader.instanceCount;

  // Safe inverse scale for non-uniform scale; avoids division by ~0.
  // NOTE: negative scale is supported; it flips handedness, but we rely on consistent winding + normals.
  // For now, this only affects ray transform and normal transform.
  for (var i = 0u; i < instanceCount; i++) {
    let inst = meshInstances[i];

    // World-space instance AABB cull
    let aabbHit = intersectAabb(ray, inst.aabbMin, inst.aabbMax);
    if (!aabbHit.hit) {
      continue;
    }
    if (aabbHit.tMin > closest.t) {
      continue;
    }

    let rotMat = rotationMatrix(inst.rotation);
    let invRotMat = transpose(rotMat);

    let sx = select(inst.scale.x, 1e-8, abs(inst.scale.x) < 1e-8);
    let sy = select(inst.scale.y, 1e-8, abs(inst.scale.y) < 1e-8);
    let sz = select(inst.scale.z, 1e-8, abs(inst.scale.z) < 1e-8);
    let invScale = vec3<f32>(1.0 / sx, 1.0 / sy, 1.0 / sz);

    // Transform world ray into mesh-local space:
    // local = (invRot * (world - position)) / scale
    var localRay: Ray;
    let o = invRotMat * (ray.origin - inst.position);
    localRay.origin = o * invScale;
    let d = invRotMat * ray.direction;
    // IMPORTANT: do NOT normalize after applying inverse non-uniform scale.
    // The intersection parameter t is defined in the ray's parameterization; renormalizing changes it.
    localRay.direction = d * invScale;

    let localHit = intersectMeshBlas(localRay, inst.meshId);
    if (!localHit.hit) {
      continue;
    }

    // Transform hit point back to world: world = position + rot * (local * scale)
    let pLocal = localHit.position;
    let pWorld = inst.position + rotMat * (pLocal * inst.scale);
    let tWorld = dot(pWorld - ray.origin, ray.direction);

    if (tWorld > 0.001 && tWorld < closest.t) {
      // Normal transform: inv-transpose of rot*scale => rot * (n / scale)
      let nLocal = localHit.normal;
      let nAdj = vec3<f32>(nLocal.x / sx, nLocal.y / sy, nLocal.z / sz);
      let nWorld = normalize(rotMat * nAdj);

      closest.hit = true;
      closest.t = tWorld;
      closest.position = pWorld;
      closest.normal = nWorld;
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
    
    let obj = meshInstances[u32(hit.objectIndex)];
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
