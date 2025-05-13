import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: resolve(__dirname, '..'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.html']
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cms: resolve(__dirname, 'cms.html'),
        review: resolve(__dirname, 'template-review.html')
      }
    }
  },
  server: {
    port: 5174,
    host: true
  }
}) 