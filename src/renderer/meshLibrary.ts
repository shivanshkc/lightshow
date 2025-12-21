import {
  buildBlas,
  createCapsuleMesh,
  createCappedConeMesh,
  createCappedCylinderMesh,
  createCuboidMesh,
  createTorusMesh,
  createUvSphereMesh,
  type Mesh,
  type Vec3,
} from '@core';

export type BuiltinMeshId =
  | 0 // sphere
  | 1 // cuboid
  | 2 // cylinder
  | 3 // cone
  | 4 // capsule
  | 5; // torus

export const BUILTIN_MESH_COUNT = 6;

export type GpuMeshLibrary = {
  meshCount: number;
  // Packed vertex buffer: per-vertex (pos.xyz, pos.w=0, n.xyz, n.w=0)
  vertices: Float32Array;
  // Packed triangle indices in BLAS leaf order (u32 indices)
  indices: Uint32Array;
  // Packed BVH nodes as an ArrayBuffer (48 bytes per node; see WGSL layout in raytracer.wgsl)
  blasNodes: ArrayBuffer;
  // Per-mesh metadata (8 u32 per mesh; see WGSL MeshMeta)
  meshMeta: Uint32Array;
  // Object-space bounds for each mesh (for instance AABB computation)
  meshAabbs: Array<{ min: Vec3; max: Vec3 }>;
};

function packVertices(mesh: Mesh): Float32Array {
  const vCount = mesh.positions.length / 3;
  const out = new Float32Array(vCount * 8);
  for (let i = 0; i < vCount; i++) {
    const px = mesh.positions[i * 3]!;
    const py = mesh.positions[i * 3 + 1]!;
    const pz = mesh.positions[i * 3 + 2]!;
    const nx = mesh.normals[i * 3]!;
    const ny = mesh.normals[i * 3 + 1]!;
    const nz = mesh.normals[i * 3 + 2]!;
    const o = i * 8;
    out[o + 0] = px;
    out[o + 1] = py;
    out[o + 2] = pz;
    out[o + 3] = 0;
    out[o + 4] = nx;
    out[o + 5] = ny;
    out[o + 6] = nz;
    out[o + 7] = 0;
  }
  return out;
}

function buildBuiltinMeshes(): Mesh[] {
  return [
    createUvSphereMesh(32, 16),
    createCuboidMesh(),
    createCappedCylinderMesh(32),
    createCappedConeMesh(32),
    createCapsuleMesh(32, 8),
    createTorusMesh(32, 16, 1, 0.35),
  ];
}

/**
 * Build a packed mesh library for the six built-in primitives.
 *
 * This is CPU-side packing only; callers are expected to upload the returned buffers to GPU.
 */
export function buildBuiltinMeshLibrary(): GpuMeshLibrary {
  const meshes = buildBuiltinMeshes();
  if (meshes.length !== BUILTIN_MESH_COUNT) {
    throw new Error(`Expected ${BUILTIN_MESH_COUNT} meshes, got ${meshes.length}`);
  }

  // First pass: sizes
  let totalVertices = 0;
  let totalIndices = 0;
  let totalNodes = 0;

  const blasPerMesh = meshes.map((m) => buildBlas(m.positions, m.indices, { maxTrisPerLeaf: 4 }));

  for (let i = 0; i < meshes.length; i++) {
    const m = meshes[i]!;
    totalVertices += m.positions.length / 3;
    // We will reorder triangles according to triRefs, producing exactly triCount * 3 indices.
    totalIndices += (m.indices.length / 3) * 3;
    totalNodes += blasPerMesh[i]!.nodes.length;
  }

  // Pack vertices and indices
  const packedVertices = new Float32Array(totalVertices * 8);
  const packedIndices = new Uint32Array(totalIndices);

  // Pack nodes into a single ArrayBuffer (48 bytes per node)
  const NODE_STRIDE_BYTES = 48;
  const nodeBuf = new ArrayBuffer(totalNodes * NODE_STRIDE_BYTES);
  const nodeF32 = new Float32Array(nodeBuf);
  const nodeI32 = new Int32Array(nodeBuf);
  const nodeU32 = new Uint32Array(nodeBuf);

  // Mesh meta: 8 u32 per mesh
  const META_STRIDE_U32 = 8;
  const meshMeta = new Uint32Array(meshes.length * META_STRIDE_U32);

  const meshAabbs: Array<{ min: Vec3; max: Vec3 }> = [];

  let vCursor = 0; // vertex count cursor
  let iCursor = 0; // index cursor (u32 indices)
  let nCursor = 0; // node cursor (nodes)

  for (let meshId = 0; meshId < meshes.length; meshId++) {
    const mesh = meshes[meshId]!;
    const blas = blasPerMesh[meshId]!;

    const vCount = mesh.positions.length / 3;
    const triCount = mesh.indices.length / 3;
    const idxCount = triCount * 3;

    // Vertices
    packedVertices.set(packVertices(mesh), vCursor * 8);

    // Indices reordered by triRefs for contiguous leaf triangle ranges
    for (let t = 0; t < blas.triRefs.length; t++) {
      const triId = blas.triRefs[t]!;
      const src = triId * 3;
      packedIndices[iCursor + t * 3 + 0] = mesh.indices[src + 0] + vCursor;
      packedIndices[iCursor + t * 3 + 1] = mesh.indices[src + 1] + vCursor;
      packedIndices[iCursor + t * 3 + 2] = mesh.indices[src + 2] + vCursor;
    }

    // Nodes (convert node-local child indices and tri offsets into global offsets)
    for (let ni = 0; ni < blas.nodes.length; ni++) {
      const node = blas.nodes[ni]!;
      const outIndex = nCursor + ni;
      const baseWord = outIndex * (NODE_STRIDE_BYTES / 4);

      // Layout:
      //   0..2  aabbMin (f32)
      //   3     left (i32)
      //   4..6  aabbMax (f32)
      //   7     right (i32)
      //   8     triIndexOffset (u32) (index into packedIndices)
      //   9     triCount (u32) (triangle count)
      //   10..11 pad (u32)
      nodeF32[baseWord + 0] = node.aabbMin[0];
      nodeF32[baseWord + 1] = node.aabbMin[1];
      nodeF32[baseWord + 2] = node.aabbMin[2];
      nodeF32[baseWord + 4] = node.aabbMax[0];
      nodeF32[baseWord + 5] = node.aabbMax[1];
      nodeF32[baseWord + 6] = node.aabbMax[2];

      if (node.left === -1) {
        nodeI32[baseWord + 3] = -1;
        nodeI32[baseWord + 7] = -1;
        nodeU32[baseWord + 8] = iCursor + node.triOffset * 3;
        nodeU32[baseWord + 9] = node.triCount;
      } else {
        nodeI32[baseWord + 3] = nCursor + node.left;
        nodeI32[baseWord + 7] = nCursor + node.right;
        nodeU32[baseWord + 8] = 0;
        nodeU32[baseWord + 9] = 0;
      }

      nodeU32[baseWord + 10] = 0;
      nodeU32[baseWord + 11] = 0;
    }

    // Mesh meta (offsets are in vertex count, index u32 count, node count)
    const metaBase = meshId * META_STRIDE_U32;
    meshMeta[metaBase + 0] = vCursor; // vertexOffset
    meshMeta[metaBase + 1] = vCount; // vertexCount
    meshMeta[metaBase + 2] = iCursor; // indexOffset
    meshMeta[metaBase + 3] = idxCount; // indexCount
    meshMeta[metaBase + 4] = nCursor; // nodeOffset
    meshMeta[metaBase + 5] = blas.nodes.length; // nodeCount
    meshMeta[metaBase + 6] = 0;
    meshMeta[metaBase + 7] = 0;

    meshAabbs.push({ min: mesh.aabbMin, max: mesh.aabbMax });

    vCursor += vCount;
    iCursor += idxCount;
    nCursor += blas.nodes.length;
  }

  return {
    meshCount: meshes.length,
    vertices: packedVertices,
    indices: packedIndices,
    blasNodes: nodeBuf,
    meshMeta,
    meshAabbs,
  };
}


