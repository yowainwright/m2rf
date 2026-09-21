import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = resolve(import.meta.dirname, '..');

export default defineConfig({
  root,
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    environment: 'happy-dom',
    include: [
      'tests/{integration,unit}/**/*.test.{ts,tsx}',
      'tests/{integration,unit}/**/start.ts',
    ],
    exclude: ['tests/unit/scripts/**'],
  },
});
