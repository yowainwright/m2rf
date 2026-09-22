import { StrictMode } from 'react';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useWorkspaceLayout } from '@/app/hooks/useWorkspaceLayout';
import { DESKTOP_MEDIA_QUERY } from '@/app/constants';

const send = vi.hoisted(() => vi.fn());
vi.mock('@/app', () => ({ AppContext: { useActorRef: () => ({ send }) } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const createViewport = () => {
  const viewport = {
    matches: true,
    addEventListener: vi.fn<(type: string, listener: () => void) => void>(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => viewport),
  );
  return viewport;
};

it('sends the current layout and viewport changes to the actor', () => {
  const viewport = createViewport();
  const { unmount } = renderHook(useWorkspaceLayout);
  expect(window.matchMedia).toHaveBeenCalledWith(DESKTOP_MEDIA_QUERY);
  expect(send).toHaveBeenLastCalledWith({ type: 'layout.update', isDesktop: true });
  const [event, listener] = viewport.addEventListener.mock.calls[0];
  expect(event).toBe('change');
  viewport.matches = false;
  listener();
  expect(send).toHaveBeenLastCalledWith({ type: 'layout.update', isDesktop: false });
  unmount();
  expect(viewport.removeEventListener).toHaveBeenCalledExactlyOnceWith('change', listener);
});

it('cleans up each subscription during StrictMode replay and unmount', () => {
  const viewport = createViewport();
  const { unmount } = renderHook(useWorkspaceLayout, { wrapper: StrictMode });
  expect(viewport.addEventListener).toHaveBeenCalledTimes(2);
  expect(viewport.removeEventListener).toHaveBeenCalledTimes(1);
  unmount();
  expect(viewport.removeEventListener.mock.calls).toEqual(viewport.addEventListener.mock.calls);
});
