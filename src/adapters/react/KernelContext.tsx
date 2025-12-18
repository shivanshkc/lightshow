import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import type { Kernel, SceneSnapshot } from '@kernel';
import { KernelShell } from '@kernel';
import { V1ZustandBackingStore } from '../v1/V1ZustandBackingStore';

type KernelContextValue = {
  kernel: Kernel;
};

const KernelContext = createContext<KernelContextValue | null>(null);

export function KernelProvider({ children }: { children: React.ReactNode }) {
  const kernel = useMemo(() => new KernelShell(new V1ZustandBackingStore()), []);
  return <KernelContext.Provider value={{ kernel }}>{children}</KernelContext.Provider>;
}

export function useKernel(): Kernel {
  const ctx = useContext(KernelContext);
  if (!ctx) throw new Error('useKernel must be used within <KernelProvider>');
  return ctx.kernel;
}

export function useKernelSceneSnapshot(): SceneSnapshot {
  const kernel = useKernel();
  return useSyncExternalStore(
    (onStoreChange) => kernel.events.subscribe(() => onStoreChange()),
    () => kernel.queries.getSceneSnapshot(),
    () => kernel.queries.getSceneSnapshot()
  );
}


