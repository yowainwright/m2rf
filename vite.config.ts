import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'm2rf',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'reactflow', 'zustand', 'mermaid', 'dagre'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          reactflow: 'ReactFlow',
          zustand: 'zustand',
          mermaid: 'mermaid',
          dagre: 'dagre',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});
