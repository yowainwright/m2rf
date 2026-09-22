import { describe, expect, test } from 'vitest';
import { redactString, redactTelemetry } from '@/app/lib/observability';

describe('observability redaction', () => {
  test('redacts sensitive object paths without mutating the input', () => {
    const telemetry = {
      input: {
        id: 'input-private',
        source: 'flowchart LR Secret[Customer system]',
        workspaceId: 'workspace-private',
      },
      label: 'Customer label',
      nested: {
        token: 'ghp_123456789012345678901234567890123456',
      },
    };

    const redacted = redactTelemetry(telemetry);

    expect(redacted).toEqual({
      input: {
        id: '[REDACTED]',
        source: '[REDACTED]',
        workspaceId: '[REDACTED]',
      },
      label: '[REDACTED]',
      nested: {
        token: '[REDACTED]',
      },
    });
    expect(telemetry.input.source).toBe('flowchart LR Secret[Customer system]');
  });

  test('redacts secrets and URLs inside strings', () => {
    const value = 'Bearer abcdefghijklmnop and https://internal.example.local/a and me@example.com';

    expect(redactString(value)).toBe('Bearer [REDACTED] and [REDACTED] and [REDACTED]');
  });
});
