import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/assemblage-web/**' // Exclude assemblage-web tests for now due to dependencies
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@supabase': path.resolve(__dirname, './supabase'),
    },
  },
});
