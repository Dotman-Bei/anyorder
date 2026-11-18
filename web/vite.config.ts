import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { type Plugin, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { type Recording, injectRecorded, recordedTokens } from './src/lib/recorded'

const page = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

// Bakes the recorded sandwich run into both pages at build time ({{rec:<key>}}
// tokens), so they read correctly with scripts off. No recording, no build:
// a page never shows a blank where a number belongs.
function recorded(): Plugin {
  const file = page('./public/recorded/sandwich.json')
  return {
    name: 'anyorder-recorded',
    transformIndexHtml(html) {
      if (!html.includes('{{rec:')) return html
      if (!existsSync(file)) throw new Error('public/recorded/sandwich.json is missing: run pnpm -C web scenario')
      return injectRecorded(html, recordedTokens(JSON.parse(readFileSync(file, 'utf8')) as Recording))
    },
  }
}

// Two static pages: the landing page at / and the dApp at /app. Vite's own
// bundles go to _app/ so they never mix with the design kit's files, which
// are served unmodified from public/assets/.
export default defineConfig({
  plugins: [react(), recorded()],
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
