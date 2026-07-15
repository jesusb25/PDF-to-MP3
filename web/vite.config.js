import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from the root by the Express server on Render.
export default defineConfig({
  plugins: [react()],
  base: '/',
  // @ffmpeg/ffmpeg ships its own bundled web worker; Vite's dep optimizer
  // rewrites the worker reference and then can't find it ("The file does not
  // exist at .../deps/worker.js?worker_file"). Excluding the ffmpeg packages
  // from pre-bundling leaves the worker import intact.
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  // In dev the API runs separately on :8000. The frontend calls the API
  // same-origin (API_BASE = ''), so proxy the API routes to the Express server
  // rather than letting Vite try to serve them (which 404s). In production
  // Express serves both from one origin, so no proxy is needed there.
  server: {
    proxy: {
      '/get-text': 'http://localhost:8000',
      '/base64data': 'http://localhost:8000',
    },
  },
})
