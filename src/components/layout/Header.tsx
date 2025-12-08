import { Settings, HelpCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="h-12 bg-panel border-b border-border-subtle flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-600" />
        <h1 className="text-lg font-semibold tracking-tight">Lightshow</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-hover rounded-md transition-colors">
          <Settings className="w-4 h-4 text-text-secondary" />
        </button>
        <button className="p-2 hover:bg-hover rounded-md transition-colors">
          <HelpCircle className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
    </header>
  );
}

