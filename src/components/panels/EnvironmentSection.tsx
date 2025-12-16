import { useSceneStore } from '../../store/sceneStore';
import { Button } from '../ui/Button';
import { ColorPicker } from '../ui/ColorPicker';

const PRESETS: Array<{
  id: 'day' | 'dusk' | 'night';
  label: string;
}> = [
  { id: 'day', label: 'Day' },
  { id: 'dusk', label: 'Dusk' },
  { id: 'night', label: 'Night' },
];

export function EnvironmentSection() {
  const { backgroundColor, setBackgroundColor, applyBackgroundPreset } = useSceneStore();

  return (
    <div className="p-3 border-b border-border-subtle">
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Environment
      </h2>

      <div className="flex gap-2 mb-3">
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => applyBackgroundPreset(p.id)}
            title={`Set background preset: ${p.label}`}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <ColorPicker
        label="Background Color"
        value={backgroundColor}
        onChange={setBackgroundColor}
      />
    </div>
  );
}


