import { Effect } from 'effect';
import { expect, it, vi } from 'vitest';
import { runOperation } from '@/app/lib/effect';

it('returns a successful Effect value', async () => {
  const controller = new AbortController();
  await expect(runOperation(Effect.succeed('saved'), controller.signal)).resolves.toBe('saved');
});

it('preserves the error from a failed Effect', async () => {
  const controller = new AbortController();
  const error = new Error('storage unavailable');
  await expect(runOperation(Effect.fail(error), controller.signal)).rejects.toBe(error);
});

it('interrupts cancelled work without settling its obsolete actor promise', async () => {
  const controller = new AbortController();
  const finalized = vi.fn();
  const settled = vi.fn();
  const operation = Effect.never.pipe(Effect.ensuring(Effect.sync(finalized)));
  void runOperation(operation, controller.signal).then(settled, settled);
  controller.abort();
  await vi.waitFor(() => expect(finalized).toHaveBeenCalledOnce());
  expect(settled).not.toHaveBeenCalled();
});
