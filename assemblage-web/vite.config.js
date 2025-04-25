import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@legacy': fileURLToPath(new URL('./src/legacy/js', import.meta.url))
    }
  },
  optimizeDeps: {
    include: [
      './src/legacy/js/collage/tilingGenerator.js',
      './src/legacy/js/collage/mosaicGenerator.js',
      './src/legacy/js/collage/slicedCollageGenerator.js',
      './src/legacy/js/collage/fragmentsGenerator.js',
      './src/legacy/js/collage/crystalGenerator.js',
      './src/legacy/js/collage/crystalFormationGenerator.js',
      './src/legacy/js/collage/isolatedCrystalGenerator.js',
      './src/legacy/js/collage/narrativeCompositionManager.js',
      './src/legacy/js/collage/maskImplementations.js'
    ]
  }
})
