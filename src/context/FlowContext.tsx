import { createContext, useContext } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

export const FlowStoreContext = createContext<UseBoundStore<StoreApi<any>> | null>(null);

export const useFlowStore = <T,>(selector?: (state: any) => T): T => {
  const store = useContext(FlowStoreContext);

  if (!store) {
    throw new Error('useFlowStore must be used within a MermaidFlow component with a store prop');
  }

  if (selector) {
    return store(selector);
  }

  return store() as T;
};
