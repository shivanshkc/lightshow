import { Canvas } from './components/Canvas';
import { DebugPanel } from './components/DebugPanel';

export default function App() {
  return (
    <div className="w-full h-full bg-base relative">
      <Canvas className="w-full h-full" />
      <DebugPanel />
    </div>
  );
}
