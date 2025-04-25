import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@legacy': path.resolve(__dirname, './src/legacy')
    }
  },
  optimizeDeps: {
    include: [
      './src/legacy/js/collage/tilingGenerator.js',
      './src/legacy/js/collage/fragmentsGenerator.js',
      './src/legacy/js/collage/mosaicGenerator.js',
      './src/legacy/js/collage/slicedCollageGenerator.js',
      './src/legacy/js/collage/narrativeCompositionManager.js',
      './src/legacy/js/collage/crystalGenerator.js'
    ]
  }
})
