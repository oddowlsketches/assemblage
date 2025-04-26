import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@legacy': path.resolve(__dirname, 'src/legacy/js'),
      '@': path.resolve(__dirname, 'src')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  esbuild: {
    loader: 'tsx',
    include: /\.(tsx|ts|jsx|js)$/,
    exclude: [],
  }
}) 