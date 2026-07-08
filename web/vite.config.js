import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from the root by the Express server on Render.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
