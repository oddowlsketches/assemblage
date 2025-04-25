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
      '@legacy/collage/tilingGenerator.js',
      '@legacy/collage/mosaicGenerator.js',
      '@legacy/collage/slicedCollageGenerator.js',
      '@legacy/collage/fragmentsGenerator.js',
      '@legacy/collage/crystalGenerator.js',
      '@legacy/collage/crystalFormationGenerator.js',
      '@legacy/collage/isolatedCrystalGenerator.js',
      '@legacy/collage/narrativeCompositionManager.js',
      '@legacy/collage/maskImplementations.js'
    ]
  }
})
