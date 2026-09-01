import { describe, expect, test, vi } from 'vitest';
import {
  createServerLogger,
  redactString,
  redactTelemetry,
  writeBrowserLog,
} from '@/observability';

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
    const value =
      'Bearer abcdefghijklmnop and https://internal.example.local/a and me@example.com';

    expect(redactString(value)).toBe(
      'Bearer [REDACTED] and [REDACTED] and [REDACTED]'
    );
  });

  test('redacts browser logs before writing', () => {
    const write = vi.fn();

    writeBrowserLog({ svg: '<svg>internal database</svg>' }, write);

    expect(write).toHaveBeenCalledWith({ svg: '[REDACTED]' });
  });

  test('redacts server logs before pino writes', () => {
    const lines: string[] = [];
    const destination = {
      write(line: string) {
        lines.push(line);
      },
    };
    const logger = createServerLogger({ destination });

    logger.info(
      {
        input: { source: 'flowchart LR Secret[Customer system]' },
        url: 'https://internal.example.local/a',
      },
      'saved graph'
    );

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('[REDACTED]');
    expect(lines[0]).not.toContain('Customer system');
    expect(lines[0]).not.toContain('internal.example.local');
  });
});
