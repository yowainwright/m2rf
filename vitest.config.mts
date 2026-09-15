import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/{integration,unit}/**/*.test.ts', 'tests/{integration,unit}/**/start.ts'],
    exclude: ['tests/unit/scripts/**'],
  },
});
