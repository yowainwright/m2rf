'use client';

import { useEffect } from 'react';
import { useStore, useStoreApi } from 'reactflow';
import { AppContext } from '@/app';
import type { ReactFlowErrorGateProps } from '@/app/types';

export function ReactFlowErrorGate({ children, onError }: ReactFlowErrorGateProps) {
  const store = useStoreApi();
  const isReady = useStore((state) => state.onError === onError);

  useEffect(() => {
    store.setState({ onError });
  }, [onError, store]);

  if (!isReady) return null;
  return children;
}

export function InitialViewportSync() {
  const { send } = AppContext.useActorRef();
  const store = useStoreApi();
  const isInitialized = useStore((state) => {
    const hasViewport = state.d3Zoom !== null;
    const hasFitView = !state.fitViewOnInit || state.fitViewOnInitDone;
    return hasViewport && hasFitView;
  });

  useEffect(() => {
    if (!isInitialized) return;
    const [x, y, zoom] = store.getState().transform;
    send({ type: 'viewport.update', viewport: { x, y, zoom } });
  }, [isInitialized, send, store]);

  return null;
}
