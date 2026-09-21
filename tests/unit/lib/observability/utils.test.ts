import { describe, expect, test, vi } from 'vitest';
import { createServerLogger, writeBrowserLog } from '@/app/lib/observability';

describe('observability logging', () => {
  test('redacts browser logs before writing', () => {
    const write = vi.fn();

    writeBrowserLog({ svg: '<svg>internal database</svg>' }, write);

    expect(write).toHaveBeenCalledWith({ svg: '[REDACTED]' });
  });

  test('redacts server logs before pino writes', () => {
    let writtenLine = '';
    const destination = {
      write(line: string) {
        writtenLine = line;
      },
    };
    const logger = createServerLogger({ destination });

    logger.info(
      {
        input: { source: 'flowchart LR Secret[Customer system]' },
        url: 'https://internal.example.local/a',
      },
      'saved graph',
    );

    expect(writtenLine).toContain('[REDACTED]');
    expect(writtenLine).not.toContain('Customer system');
    expect(writtenLine).not.toContain('internal.example.local');
  });
});
