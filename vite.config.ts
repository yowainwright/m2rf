import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@studio': resolve(import.meta.dirname, 'src/studio'),
    },
  },
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/test-setup.ts'],
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'm2rf',
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'reactflow',
        'mermaid',
        'dagre',
        'canvg',
        'effect',
        'gifenc',
        'rxjs',
        'xstate',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          reactflow: 'ReactFlow',
          mermaid: 'mermaid',
          dagre: 'dagre',
          canvg: 'canvg',
          effect: 'effect',
          gifenc: 'gifenc',
          rxjs: 'rxjs',
          xstate: 'xstate',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});
