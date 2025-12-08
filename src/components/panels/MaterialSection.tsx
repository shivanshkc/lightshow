import { SceneObject, MATERIAL_TYPES } from '../../core/types';
import { Panel } from '../ui/Panel';

interface MaterialSectionProps {
  object: SceneObject;
}

export function MaterialSection({ object }: MaterialSectionProps) {
  const { type, color, ior, intensity } = object.material;
  const materialLabel =
    MATERIAL_TYPES.find((m) => m.value === type)?.label ?? type;

  // Convert color to hex for display
  const colorHex = `#${color
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

  return (
    <Panel title="Material">
      <div className="space-y-3">
        <div>
          <label className="text-xs text-text-secondary block mb-1">Type</label>
          <div className="text-sm">{materialLabel}</div>
        </div>

        <div>
          <label className="text-xs text-text-secondary block mb-1">Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-border-default"
              style={{ backgroundColor: colorHex }}
            />
            <span className="text-xs font-mono text-text-muted">{colorHex}</span>
          </div>
        </div>

        {type === 'glass' && (
          <div>
            <label className="text-xs text-text-secondary block mb-1">
              Index of Refraction
            </label>
            <div className="text-sm font-mono">{ior.toFixed(2)}</div>
          </div>
        )}

        {type === 'light' && (
          <div>
            <label className="text-xs text-text-secondary block mb-1">
              Intensity
            </label>
            <div className="text-sm font-mono">{intensity.toFixed(1)}</div>
          </div>
        )}
      </div>
    </Panel>
  );
}

