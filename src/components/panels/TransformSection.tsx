import { SceneObject } from '../../core/types';
import { Panel } from '../ui/Panel';

interface TransformSectionProps {
  object: SceneObject;
}

export function TransformSection({ object }: TransformSectionProps) {
  const { position, rotation, scale } = object.transform;

  return (
    <Panel title="Transform">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-secondary block mb-1">
            Position
          </label>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-gizmo-x">X: {position[0].toFixed(2)}</span>
            <span className="text-gizmo-y">Y: {position[1].toFixed(2)}</span>
            <span className="text-gizmo-z">Z: {position[2].toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">
            Rotation
          </label>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-gizmo-x">
              X: {((rotation[0] * 180) / Math.PI).toFixed(1)}°
            </span>
            <span className="text-gizmo-y">
              Y: {((rotation[1] * 180) / Math.PI).toFixed(1)}°
            </span>
            <span className="text-gizmo-z">
              Z: {((rotation[2] * 180) / Math.PI).toFixed(1)}°
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">Scale</label>
          <div className="flex gap-2 text-xs font-mono">
            <span className="text-gizmo-x">X: {scale[0].toFixed(2)}</span>
            <span className="text-gizmo-y">Y: {scale[1].toFixed(2)}</span>
            <span className="text-gizmo-z">Z: {scale[2].toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

