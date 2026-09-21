import { cleanup, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useSaveShortcut } from '@/app/hooks/useSaveShortcut';

afterEach(cleanup);

it.each([
  { key: 's', ctrlKey: true },
  { key: 'S', ctrlKey: true },
  { key: 's', metaKey: true },
  { key: 'S', metaKey: true },
  { key: 's', ctrlKey: true, metaKey: true },
])('saves and prevents the browser shortcut for %o', (options) => {
  const save = vi.fn();
  renderHook(() => useSaveShortcut(save));
  const eventOptions = Object.assign({}, options, { cancelable: true });
  const event = new KeyboardEvent('keydown', eventOptions);

  fireEvent(window, event);

  expect(save).toHaveBeenCalledOnce();
  expect(event.defaultPrevented).toBe(true);
});

it.each([
  { key: 's' },
  { key: 'x', ctrlKey: true },
  { key: 's', ctrlKey: true, altKey: true },
  { key: 's', metaKey: true, altKey: true },
  { key: 's', ctrlKey: true, shiftKey: true },
  { key: 's', metaKey: true, shiftKey: true },
  { key: 's', ctrlKey: true, isComposing: true },
  { key: 's', metaKey: true, isComposing: true },
])('ignores %o without preventing its default', (options) => {
  const save = vi.fn();
  renderHook(() => useSaveShortcut(save));
  const eventOptions = Object.assign({}, options, { cancelable: true });
  const event = new KeyboardEvent('keydown', eventOptions);

  fireEvent(window, event);

  expect(save).not.toHaveBeenCalled();
  expect(event.defaultPrevented).toBe(false);
});

it('prevents repeated save shortcuts without invoking the callback', () => {
  const save = vi.fn();
  renderHook(() => useSaveShortcut(save));
  const event = new KeyboardEvent('keydown', {
    key: 's',
    ctrlKey: true,
    repeat: true,
    cancelable: true,
  });

  fireEvent(window, event);

  expect(save).not.toHaveBeenCalled();
  expect(event.defaultPrevented).toBe(true);
});

it('uses the current callback and removes the listener on unmount', () => {
  const original = vi.fn();
  const current = vi.fn();
  const { rerender, unmount } = renderHook((callback) => useSaveShortcut(callback), {
    initialProps: original,
  });
  rerender(current);
  fireEvent.keyDown(window, { key: 's', metaKey: true });
  expect(original).not.toHaveBeenCalled();
  expect(current).toHaveBeenCalledOnce();

  unmount();
  const event = new KeyboardEvent('keydown', {
    key: 's',
    metaKey: true,
    cancelable: true,
  });
  fireEvent(window, event);
  expect(current).toHaveBeenCalledOnce();
  expect(event.defaultPrevented).toBe(false);
});
