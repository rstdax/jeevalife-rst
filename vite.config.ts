import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // Using relative paths prevents asset loading mismatches on Firebase
  build: {
    cssMinify: 'esbuild',
    minify: 'esbuild',
  },
  plugins: [
    react()
  ]
})