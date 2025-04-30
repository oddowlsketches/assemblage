import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  optimizeDeps: {
    include: ['paper']
  },
  esbuild: {
    loader: 'tsx',
    include: /\.(tsx|ts|jsx|js)$/,
    exclude: [],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        maskReview: path.resolve(__dirname, 'mask-review.html'),
      }
    }
  },
  server: {
    open: '/mask-review.html'
  }
}) 