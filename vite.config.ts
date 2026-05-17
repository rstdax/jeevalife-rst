import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/', // Using relative paths prevents asset loading mismatches on Firebase
  build: {
    cssMinify: 'esbuild',
    minify: 'esbuild',
  },
  plugins: [
    tailwindcss(),
    react(),
  ]
})