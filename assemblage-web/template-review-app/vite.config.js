import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: '/template-review.html',
    hmr: true
  },
  optimizeDeps: {
    include: ['paper', 'react', 'react-dom']
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        templateReview: path.resolve(__dirname, 'template-review.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
}) 