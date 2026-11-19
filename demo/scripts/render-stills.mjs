// Renders one storyboard still per scene into out/storyboard/ (git-ignored).
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { scenes } = JSON.parse(readFileSync(join(root, 'src', 'scenes.json'), 'utf8'))
const out = join(root, 'out', 'storyboard')
mkdirSync(out, { recursive: true })
for (const s of scenes) {
  // node runs the Remotion CLI directly: no shell, so paths with spaces stay intact
  const r = spawnSync(
    process.execPath,
    [join(root, 'node_modules', '@remotion', 'cli', 'remotion-cli.js'), 'still', 'src/index.ts', `SB-${s.id}`, join(out, `${s.id}.png`)],
    { cwd: root, stdio: 'inherit' },
  )
  if (r.status !== 0) process.exit(r.status ?? 1)
}
