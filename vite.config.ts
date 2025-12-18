import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@adapters': path.resolve(__dirname, 'src/adapters'),
      '@bench': path.resolve(__dirname, 'src/bench'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@gizmos': path.resolve(__dirname, 'src/gizmos'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@kernel': path.resolve(__dirname, 'src/kernel'),
      '@ports': path.resolve(__dirname, 'src/ports'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});

