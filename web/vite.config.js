import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hosted on GitHub Pages under /PDF-to-MP3/ — base must match the repo path.
export default defineConfig({
  plugins: [react()],
  base: '/PDF-to-MP3/',
})
