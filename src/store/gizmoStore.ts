import { create } from 'zustand';

export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'none';
export type GizmoAxis =
  | 'x'
  | 'y'
  | 'z'
  | 'xy'
  | 'xz'
  | 'yz'
  | 'xyz' // translate: free move
  | 'trackball' // rotate: free rotate ring
  | 'uniform' // scale: center cube
  | null;

interface GizmoState {
  mode: GizmoMode;
  hoveredAxis: GizmoAxis;
  activeAxis: GizmoAxis;
  isDragging: boolean;

  // Drag state
  dragStartPosition: [number, number, number] | null;
  dragStartMousePosition: [number, number] | null;

  // Actions
  setMode: (mode: GizmoMode) => void;
  setHoveredAxis: (axis: GizmoAxis) => void;
  startDrag: (
    axis: GizmoAxis,
    objectPosition: [number, number, number],
    mousePosition: [number, number]
  ) => void;
  endDrag: () => void;
  reset: () => void;
}

export const useGizmoStore = create<GizmoState>((set) => ({
  mode: 'translate',
  hoveredAxis: null,
  activeAxis: null,
  isDragging: false,
  dragStartPosition: null,
  dragStartMousePosition: null,

  setMode: (mode) => set({ mode }),

  setHoveredAxis: (axis) => set({ hoveredAxis: axis }),

  startDrag: (axis, objectPosition, mousePosition) =>
    set({
      activeAxis: axis,
      isDragging: true,
      dragStartPosition: objectPosition,
      dragStartMousePosition: mousePosition,
    }),

  endDrag: () =>
    set({
      activeAxis: null,
      isDragging: false,
      dragStartPosition: null,
      dragStartMousePosition: null,
    }),

  reset: () =>
    set({
      hoveredAxis: null,
      activeAxis: null,
      isDragging: false,
      dragStartPosition: null,
      dragStartMousePosition: null,
    }),
}));

/**
 * Convert GizmoAxis to numeric ID for shader
 * 0=none, 1=x, 2=y, 3=z, 4=xy, 5=xz, 6=yz, 7=xyz, 8=trackball, 9=uniform
 */
export function axisToId(axis: GizmoAxis): number {
  switch (axis) {
    case 'x':
      return 1;
    case 'y':
      return 2;
    case 'z':
      return 3;
    case 'xy':
      return 4;
    case 'xz':
      return 5;
    case 'yz':
      return 6;
    case 'xyz':
      return 7;
    case 'trackball':
      return 8;
    case 'uniform':
      return 9;
    default:
      return 0;
  }
}

/**
 * Convert numeric ID to GizmoAxis
 */
export function idToAxis(id: number): GizmoAxis {
  switch (id) {
    case 1:
      return 'x';
    case 2:
      return 'y';
    case 3:
      return 'z';
    case 4:
      return 'xy';
    case 5:
      return 'xz';
    case 6:
      return 'yz';
    case 7:
      return 'xyz';
    case 8:
      return 'trackball';
    case 9:
      return 'uniform';
    default:
      return null;
  }
}

