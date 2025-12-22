import { useCallback } from 'react';
import type { SceneObjectSnapshot } from '@ports';
import { useKernel } from '@adapters';
import { Panel } from '../ui/Panel';
import { Vec3Input } from '../ui/Vec3Input';
import { NumberInput } from '../ui/NumberInput';
import { IconButton } from '../ui/IconButton';
import { RotateCcw } from 'lucide-react';

interface TransformSectionProps {
  object: SceneObjectSnapshot;
}

function isFiniteNumber(v: number): boolean {
  return Number.isFinite(v);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function TransformSection({ object }: TransformSectionProps) {
  const kernel = useKernel();

  const handleResetTransform = useCallback(() => {
    kernel.dispatch({
      v: 1,
      type: 'transform.update',
      objectId: object.id,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    });
  }, [kernel, object.id]);

  const handlePositionChange = useCallback(
    (position: [number, number, number]) => {
      kernel.dispatch({ v: 1, type: 'transform.update', objectId: object.id, transform: { position } });
    },
    [kernel, object.id]
  );

  const handleRotationChange = useCallback(
    (rotationDegrees: [number, number, number]) => {
      // Convert degrees to radians for storage
      kernel.dispatch({
        v: 1,
        type: 'transform.update',
        objectId: object.id,
        transform: {
          rotation: rotationDegrees.map((d) => (d * Math.PI) / 180) as [number, number, number],
        },
      });
    },
    [kernel, object.id]
  );

  const handleScaleChange = useCallback(
    (scale: [number, number, number]) => {
      // For spheres, enforce uniform scale
      if (object.type === 'sphere') {
        const uniform = scale[0];
        kernel.dispatch({
          v: 1,
          type: 'transform.update',
          objectId: object.id,
          transform: { scale: [uniform, uniform, uniform] },
        });
      } else {
        kernel.dispatch({ v: 1, type: 'transform.update', objectId: object.id, transform: { scale } });
      }
    },
    [kernel, object.id, object.type]
  );

  const handleRadiusHeightChange = useCallback(
    (next: { radius?: number; height?: number }) => {
      const minRadius = 0.1;
      const minHeight = 0.1;

      const currentRadius = object.transform.scale[0];
      const currentHeight = object.transform.scale[1] * 2;

      const radiusRaw = next.radius ?? currentRadius;
      const heightRaw = next.height ?? currentHeight;

      if (!isFiniteNumber(radiusRaw) || !isFiniteNumber(heightRaw)) return;

      const radius = clamp(radiusRaw, minRadius, Number.POSITIVE_INFINITY);
      const height = clamp(heightRaw, minHeight, Number.POSITIVE_INFINITY);
      const halfHeight = height / 2;

      handleScaleChange([radius, halfHeight, radius]);
    },
    [handleScaleChange, object.transform.scale]
  );

  const handleTorusRadiiChange = useCallback(
    (next: { inner?: number; outer?: number }) => {
      const min = 0.1;
      const minGap = 0.01;

      const R = object.transform.scale[0];
      const r = object.transform.scale[1];
      const currentInner = Math.max(min, R - r);
      const currentOuter = Math.max(min + minGap, R + r);

      const innerRaw = next.inner ?? currentInner;
      const outerRaw = next.outer ?? currentOuter;

      if (!isFiniteNumber(innerRaw) || !isFiniteNumber(outerRaw)) return;

      // Enforce: outer > inner > 0
      const inner = clamp(innerRaw, min, Number.POSITIVE_INFINITY);
      const outer = clamp(outerRaw, inner + minGap, Number.POSITIVE_INFINITY);

      const nextR = (outer + inner) / 2;
      const nextr = (outer - inner) / 2;

      handleScaleChange([nextR, nextr, nextr]);
    },
    [handleScaleChange, object.transform.scale]
  );

  // Convert radians to degrees for display
  const rotationDegrees: [number, number, number] = [
    (object.transform.rotation[0] * 180) / Math.PI,
    (object.transform.rotation[1] * 180) / Math.PI,
    (object.transform.rotation[2] * 180) / Math.PI,
  ];

  return (
    <Panel
      title="Transform"
      headerRight={
        <IconButton
          aria-label="Reset Transform"
          title="Reset Transform"
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={handleResetTransform}
        />
      }
    >
      <div className="space-y-4">
        <Vec3Input
          label="Position"
          value={object.transform.position}
          onChange={handlePositionChange}
          step={0.1}
        />

        <Vec3Input
          label="Rotation (°)"
          value={rotationDegrees}
          onChange={handleRotationChange}
          step={1}
          precision={1}
        />

        {object.type === 'sphere' ? (
          <div className="space-y-1">
            <label className="text-xs text-text-secondary">Radius</label>
            <NumberInput
              value={object.transform.scale[0]}
              onChange={(v) => handleScaleChange([v, v, v])}
              min={0.1}
              step={0.1}
            />
          </div>
        ) : object.type === 'cylinder' || object.type === 'cone' || object.type === 'capsule' ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Radius</label>
              <NumberInput
                value={object.transform.scale[0]}
                onChange={(v) => handleRadiusHeightChange({ radius: v })}
                min={0.1}
                step={0.1}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Height</label>
              <NumberInput
                value={object.transform.scale[1] * 2}
                onChange={(v) => handleRadiusHeightChange({ height: v })}
                min={0.1}
                step={0.1}
              />
            </div>
          </div>
        ) : object.type === 'torus' ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Inner radius</label>
              <NumberInput
                value={object.transform.scale[0] - object.transform.scale[1]}
                onChange={(v) => handleTorusRadiiChange({ inner: v })}
                min={0.1}
                step={0.1}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Outer radius</label>
              <NumberInput
                value={object.transform.scale[0] + object.transform.scale[1]}
                onChange={(v) => handleTorusRadiiChange({ outer: v })}
                min={0.1}
                step={0.1}
              />
            </div>
          </div>
        ) : (
          <Vec3Input
            label="Scale"
            value={object.transform.scale}
            onChange={handleScaleChange}
            min={0.1}
            step={0.1}
          />
        )}
      </div>
    </Panel>
  );
}
