import { describe, expect, test } from 'vitest';
import {
  OBSERVABILITY_EVENT_NAMES,
  OBSERVABILITY_REDACTED_VALUE,
  createObservability,
  createObservabilityEvent,
  redactObservabilityAttributes,
} from './index';

describe('observability redaction', () => {
  test('redacts sensitive keys recursively', () => {
    const attributes = redactObservabilityAttributes({
      diagramKind: 'flowchart',
      nested: {
        source: 'flowchart LR\nA-->B',
        label: 'Customer A',
      },
      nodeCount: 2,
    });

    expect(attributes.diagramKind).toBe('flowchart');
    expect(attributes.nodeCount).toBe(2);
    expect(attributes.nested).toEqual({
      source: OBSERVABILITY_REDACTED_VALUE,
      label: OBSERVABILITY_REDACTED_VALUE,
    });
  });

  test('redacts token-shaped values in otherwise safe strings', () => {
    const attributes = redactObservabilityAttributes({
      failureType: 'request_failed',
      message: 'Authorization: Bearer abc.def.ghi',
    });

    expect(attributes.failureType).toBe('request_failed');
    expect(attributes.message).toBe(
      `Authorization: ${OBSERVABILITY_REDACTED_VALUE}`
    );
  });

  test('creates redacted events before dispatching to sinks', () => {
    const events: unknown[] = [];
    const observability = createObservability([
      (event) => {
        events.push(event);
      },
    ]);

    const event = observability.track({
      name: OBSERVABILITY_EVENT_NAMES.renderFailed,
      attributes: {
        source: 'flowchart LR\nA-->B',
        failureType: 'parse_error',
      },
      occurredAt: '2026-08-30T00:00:00.000Z',
      status: 'failed',
    });

    expect(event.attributes.source).toBe(OBSERVABILITY_REDACTED_VALUE);
    expect(event.attributes.failureType).toBe('parse_error');
    expect(events).toEqual([event]);
  });

  test('creates a timestamped event without a sink', () => {
    const event = createObservabilityEvent({
      name: OBSERVABILITY_EVENT_NAMES.stateTransition,
      attributes: { state: 'ready' },
    });

    expect(event.occurredAt).toEqual(expect.any(String));
    expect(event.attributes.state).toBe('ready');
  });
});
