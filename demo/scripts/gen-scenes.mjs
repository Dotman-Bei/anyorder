// Reads the approved demo script (the single source of the words and the shot list)
// and writes src/scenes.json. Never edit scenes.json by hand: edit the script.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const docs = join(here, '..', '..', 'docs', 'demo')
const file = readdirSync(docs).filter((f) => f.endsWith('-demo-script.md')).sort().pop()
const lines = readFileSync(join(docs, file), 'utf8').split(/\r?\n/)

const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim())

const scenes = []
let section = ''
for (const l of lines) {
  if (l.startsWith('## ')) section = l
  if (section.startsWith('## 3') && /^\| S\d+ /.test(l)) {
    const [id, seconds, visual, cue, driver, , gate, retakes, take] = cells(l)
    scenes.push({ id, seconds: Number(seconds), visual, cue, driver, gate, retakes: Number(retakes), take })
  }
}
const words = {}
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^\*\*(S\d+)\*\* — (.*)$/)
  if (m) {
    const meta = lines[i + 1] ?? ''
    words[m[1]] = { text: m[2], wordCount: Number((meta.match(/^words: (\d+)/) ?? [])[1]) }
  }
}
for (const s of scenes) {
  const w = words[s.id]
  if (!w) throw new Error(`no narration for ${s.id}`)
  const n = w.text.split(/\s+/).length
  if (n !== w.wordCount) throw new Error(`${s.id}: script says ${w.wordCount} words, text has ${n}`)
  s.narration = w.text
}
writeFileSync(join(here, '..', 'src', 'scenes.json'), JSON.stringify({ source: file, scenes }, null, 2) + '\n')
console.log(`${scenes.length} scenes from ${file}; ${scenes.reduce((a, s) => a + s.seconds, 0)} s planned`)
