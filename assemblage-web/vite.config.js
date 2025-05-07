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
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.html']
  },
  optimizeDeps: {
    include: ['paper']
  },
  esbuild: {
    loader: 'tsx',
    include: /\.(tsx|ts|jsx|js|html)$/,
    exclude: [],
  },
  build: {
    rollupOptions: {
      input: {
        main: '/index.html',
        maskReview: '/mask-review.html',
        templateReview: '/template-review-app/template-review.html'
      }
    }
  },
  server: {
    open: '/template-review-app/template-review.html'
  }
}) 