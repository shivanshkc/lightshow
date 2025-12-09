// Gizmo rendering shader
// Renders translation/rotation/scale gizmos on top of the scene

struct Uniforms {
  viewProjection: mat4x4<f32>,
  gizmoPosition: vec3<f32>,
  gizmoScale: f32,
  hoveredAxis: u32,    // 0=none, 1=x, 2=y, 3=z, 4=xy, 5=xz, 6=yz, 7=xyz
  activeAxis: u32,
  _pad: vec2<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec4<f32>,
  @location(2) axisId: f32,  // Which axis this vertex belongs to (as float for vertex format)
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  // Scale gizmo to maintain constant screen size, then translate to object position
  let worldPos = input.position * uniforms.gizmoScale + uniforms.gizmoPosition;
  output.position = uniforms.viewProjection * vec4<f32>(worldPos, 1.0);
  
  // Determine highlight based on hover/active state
  var color = input.color;
  let axisId = u32(input.axisId);
  
  if (axisId == uniforms.activeAxis) {
    // Active (dragging) - full bright
    color = vec4<f32>(min(color.rgb * 1.5, vec3<f32>(1.0)), 1.0);
  } else if (axisId == uniforms.hoveredAxis) {
    // Hovered - slightly brighter
    color = vec4<f32>(min(color.rgb * 1.3, vec3<f32>(1.0)), color.a);
  }
  
  output.color = color;
  
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}

