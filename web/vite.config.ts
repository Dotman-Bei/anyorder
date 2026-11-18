import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const page = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

// Two static pages: the landing page at / and the dApp at /app. Vite's own
// bundles go to _app/ so they never mix with the design kit's files, which
// are served unmodified from public/assets/.
export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: '_app',
    rollupOptions: {
      input: {
        landing: page('./index.html'),
        app: page('./app/index.html'),
      },
    },
  },
})
