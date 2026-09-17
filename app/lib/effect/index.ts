import { Cause, Effect, Exit } from 'effect';

export const runOperation = <Value>(
  operation: Effect.Effect<Value, Error>,
  signal: AbortSignal,
) => {
  return Effect.runPromiseExit(operation, { signal }).then((result) => {
    // React StrictMode can restart the actor before its cancelled promise settles.
    // The Effect has stopped; leave that obsolete promise without a completion event.
    if (signal.aborted) return new Promise<Value>(() => {});
    if (Exit.isSuccess(result)) return result.value;
    throw Cause.squash(result.cause);
  });
};
