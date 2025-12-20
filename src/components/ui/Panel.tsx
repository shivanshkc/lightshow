import { ReactNode } from 'react';

interface PanelProps {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, headerRight, children }: PanelProps) {
  return (
    <div className="border-b border-border-subtle">
      <div className="px-3 py-2 bg-panel-secondary flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h3>
        {headerRight ? (
          <div className="flex items-center flex-shrink-0">{headerRight}</div>
        ) : null}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

