import { describe, it, expect, beforeEach } from 'vitest';
import { useGizmoStore, axisToId, idToAxis } from '../store/gizmoStore';

describe('gizmoStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGizmoStore.setState({
      mode: 'translate',
      hoveredAxis: null,
      activeAxis: null,
      isDragging: false,
      dragStartPosition: null,
      dragStartMousePosition: null,
    });
  });

  describe('initial state', () => {
    it('should have default mode set to translate', () => {
      const state = useGizmoStore.getState();
      expect(state.mode).toBe('translate');
    });

    it('should have no hovered axis initially', () => {
      const state = useGizmoStore.getState();
      expect(state.hoveredAxis).toBeNull();
    });

    it('should not be dragging initially', () => {
      const state = useGizmoStore.getState();
      expect(state.isDragging).toBe(false);
    });
  });

  describe('setMode', () => {
    it('should set gizmo mode', () => {
      useGizmoStore.getState().setMode('rotate');
      expect(useGizmoStore.getState().mode).toBe('rotate');
    });

    it('should set mode to none', () => {
      useGizmoStore.getState().setMode('none');
      expect(useGizmoStore.getState().mode).toBe('none');
    });
  });

  describe('setHoveredAxis', () => {
    it('should set hovered axis', () => {
      useGizmoStore.getState().setHoveredAxis('x');
      expect(useGizmoStore.getState().hoveredAxis).toBe('x');
    });

    it('should clear hovered axis', () => {
      useGizmoStore.getState().setHoveredAxis('y');
      useGizmoStore.getState().setHoveredAxis(null);
      expect(useGizmoStore.getState().hoveredAxis).toBeNull();
    });
  });

  describe('startDrag', () => {
    it('should start dragging with correct state', () => {
      const position: [number, number, number] = [1, 2, 3];
      const mousePos: [number, number] = [100, 200];
      
      useGizmoStore.getState().startDrag('x', position, mousePos);
      
      const state = useGizmoStore.getState();
      expect(state.isDragging).toBe(true);
      expect(state.activeAxis).toBe('x');
      expect(state.dragStartPosition).toEqual(position);
      expect(state.dragStartMousePosition).toEqual(mousePos);
    });

    it('should work with plane axes', () => {
      useGizmoStore.getState().startDrag('xy', [0, 0, 0], [0, 0]);
      expect(useGizmoStore.getState().activeAxis).toBe('xy');
    });
  });

  describe('endDrag', () => {
    it('should end dragging and clear state', () => {
      useGizmoStore.getState().startDrag('z', [1, 1, 1], [50, 50]);
      useGizmoStore.getState().endDrag();
      
      const state = useGizmoStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.activeAxis).toBeNull();
      expect(state.dragStartPosition).toBeNull();
      expect(state.dragStartMousePosition).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all gizmo interaction state', () => {
      useGizmoStore.getState().setHoveredAxis('y');
      useGizmoStore.getState().startDrag('x', [1, 2, 3], [100, 200]);
      useGizmoStore.getState().reset();
      
      const state = useGizmoStore.getState();
      expect(state.hoveredAxis).toBeNull();
      expect(state.activeAxis).toBeNull();
      expect(state.isDragging).toBe(false);
      expect(state.dragStartPosition).toBeNull();
      expect(state.dragStartMousePosition).toBeNull();
    });
  });
});

describe('axisToId', () => {
  it('should convert null to 0', () => {
    expect(axisToId(null)).toBe(0);
  });

  it('should convert x to 1', () => {
    expect(axisToId('x')).toBe(1);
  });

  it('should convert y to 2', () => {
    expect(axisToId('y')).toBe(2);
  });

  it('should convert z to 3', () => {
    expect(axisToId('z')).toBe(3);
  });

  it('should convert xy to 4', () => {
    expect(axisToId('xy')).toBe(4);
  });

  it('should convert xz to 5', () => {
    expect(axisToId('xz')).toBe(5);
  });

  it('should convert yz to 6', () => {
    expect(axisToId('yz')).toBe(6);
  });

  it('should convert xyz to 7', () => {
    expect(axisToId('xyz')).toBe(7);
  });
});

describe('idToAxis', () => {
  it('should convert 0 to null', () => {
    expect(idToAxis(0)).toBeNull();
  });

  it('should convert 1 to x', () => {
    expect(idToAxis(1)).toBe('x');
  });

  it('should convert 2 to y', () => {
    expect(idToAxis(2)).toBe('y');
  });

  it('should convert 3 to z', () => {
    expect(idToAxis(3)).toBe('z');
  });

  it('should convert 4 to xy', () => {
    expect(idToAxis(4)).toBe('xy');
  });

  it('should convert 5 to xz', () => {
    expect(idToAxis(5)).toBe('xz');
  });

  it('should convert 6 to yz', () => {
    expect(idToAxis(6)).toBe('yz');
  });

  it('should convert 7 to xyz', () => {
    expect(idToAxis(7)).toBe('xyz');
  });

  it('should convert unknown ids to null', () => {
    expect(idToAxis(99)).toBeNull();
  });
});

