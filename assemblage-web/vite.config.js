import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: resolve(__dirname, '..'),
  plugins: [react()],
  optimizeDeps: {
    include: ['phosphor-react'],
  },
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
    host: true,
    proxy: {
      // Proxy /.netlify/functions requests to the Netlify Functions server
      '/.netlify/functions': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.js',
    css: true,
  }
}) 