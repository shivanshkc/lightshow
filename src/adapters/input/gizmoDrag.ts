import type { Command } from '@ports';
import type { Vec3, Ray } from '@core';
import { mat4Inverse, mat4Perspective, screenToWorldRay, sub } from '@core';
import { TranslateGizmo, RotateGizmo, ScaleGizmo } from '@gizmos';

export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'none';
export type GizmoAxis =
  | 'x'
  | 'y'
  | 'z'
  | 'xy'
  | 'xz'
  | 'yz'
  | 'xyz'
  | 'trackball'
  | 'uniform'
  | null;

export type CameraPickState = {
  position: Vec3;
  fovY: number;
  getViewMatrix(): ReturnType<typeof mat4Perspective>; // Mat4
};

export type DragFrameInput = {
  mode: GizmoMode;
  axis: GizmoAxis;
  objectId: string;
  objectType: 'sphere' | 'cuboid';
  objectPosition: Vec3;
  startPosition: Vec3;
  startRotation: Vec3 | null;
  startScale: Vec3 | null;
  dragStartRay: Ray | null;
  dragStartMouse: [number, number]; // client-space
  currentMouse: { x: number; y: number };
  rect: { left: number; top: number; width: number; height: number };
  camera: CameraPickState;
  modifiers: { ctrlOrMeta: boolean; shift: boolean };
  cameraForward: Vec3;
};

/**
 * Compute the transform.update command for a gizmo drag frame.
 * Returns null when no update is applicable.
 *
 * This module is a v2 "input/controller" boundary: UI should not contain
 * the drag→math→command logic.
 */
export function computeGizmoDragCommand(input: DragFrameInput): Command | null {
  const {
    mode,
    axis,
    objectId,
    objectType,
    startPosition,
    startRotation,
    startScale,
    dragStartRay,
    dragStartMouse,
    currentMouse,
    rect,
    camera,
    modifiers,
    cameraForward,
  } = input;

  if (!axis) return null;

  // Build world ray from current pointer.
  const viewMatrix = camera.getViewMatrix();
  const aspect = rect.width / rect.height;
  const projMatrix = mat4Perspective(camera.fovY, aspect, 0.1, 1000);
  const inverseView = mat4Inverse(viewMatrix);
  const inverseProjection = mat4Inverse(projMatrix);

  // screenToWorldRay expects coordinates relative to the canvas/viewport rect.
  const localX = currentMouse.x - rect.left;
  const localY = currentMouse.y - rect.top;
  const currentRay = screenToWorldRay(
    localX,
    localY,
    rect.width,
    rect.height,
    inverseProjection,
    inverseView,
    camera.position
  );

  if (mode === 'translate' && dragStartRay) {
    let newPosition = TranslateGizmo.calculateDragPositionRayPlane(
      axis as any,
      startPosition,
      dragStartRay,
      currentRay,
      cameraForward
    );

    // Grid snapping
    if (modifiers.ctrlOrMeta) {
      newPosition = TranslateGizmo.snapToGrid(newPosition, 0.5);
    }

    // Precision mode
    if (modifiers.shift && !modifiers.ctrlOrMeta) {
      const movement = sub(newPosition, startPosition);
      const preciseMovement = TranslateGizmo.applyPrecision(movement, true, 0.1);
      newPosition = [
        startPosition[0] + preciseMovement[0],
        startPosition[1] + preciseMovement[1],
        startPosition[2] + preciseMovement[2],
      ];
    }

    return { v: 1, type: 'transform.update', objectId, transform: { position: newPosition } };
  }

  if (mode === 'rotate' && startRotation) {
    if (axis === 'x' || axis === 'y' || axis === 'z' || axis === 'trackball') {
      let rotationDelta = RotateGizmo.calculateRotation(
        axis as any,
        input.objectPosition,
        dragStartMouse,
        [currentMouse.x, currentMouse.y],
        camera.position
      );

      // Angle snapping
      if (modifiers.ctrlOrMeta) {
        rotationDelta = [
          RotateGizmo.snapAngle(rotationDelta[0]),
          RotateGizmo.snapAngle(rotationDelta[1]),
          RotateGizmo.snapAngle(rotationDelta[2]),
        ];
      }

      const newRotation = RotateGizmo.addRotation(startRotation as any, rotationDelta as any);
      return { v: 1, type: 'transform.update', objectId, transform: { rotation: newRotation as any } };
    }
  }

  if (mode === 'scale' && startScale) {
    const scaleAxis =
      axis === 'uniform' || axis === 'xy' || axis === 'xz' || axis === 'yz' || axis === 'xyz'
        ? 'uniform'
        : axis === 'trackball'
          ? 'uniform'
          : axis;

    let newScale = ScaleGizmo.calculateScale(
      scaleAxis as any,
      startScale as any,
      dragStartMouse,
      [currentMouse.x, currentMouse.y],
      objectType
    );

    if (modifiers.ctrlOrMeta) {
      newScale = ScaleGizmo.snapScale(newScale as any) as any;
    }

    return { v: 1, type: 'transform.update', objectId, transform: { scale: newScale as any } };
  }

  return null;
}


