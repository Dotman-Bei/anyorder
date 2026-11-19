// Audio-first conform: per scene, cut the recorded footage into segments (real-time unless a speed is
// stated; every speed-up is labelled on screen), freeze-hold the last frame where the voice outlasts the
// footage, and write public/<id>.mp4 + public/<id>.wav + src/timeline.json for the Remotion composition.
// Nothing is invented: every frame comes from the recorded take; freezes repeat a real frame.
import { spawnSync } from 'node:child_process'
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const LEAD = 0.2
// seg: {f, t, r} = footage from..to at rate r;  {freeze: seconds} = hold the previous frame
const PLAN = {
  S1: { take: 'S1/S1-take1.mp4', segs: [{ f: 0.3, t: 11.9, r: 1 }] },
  S2: { take: 'S2/S2-take1.mp4', segs: [{ f: 0.9, t: 11.8, r: 1 }] },
  S3: { take: 'S3/S3-take3.mp4', segs: [{ f: 4.5, t: 8.1, r: 1 }, { f: 8.1, t: 14.6, r: 2 }, { f: 14.6, t: 34.7, r: 1 }, { freeze: 3.1 }, { f: 34.7, t: 47.6, r: 1 }] },
  S4: { take: 'S4/S4-take1.mp4', segs: [{ f: 0.6, t: 18.8, r: 1 }, { freeze: 6.8 }] },
  S5: { take: 'S5/S5-take2.mp4', segs: [{ f: 0, t: 14.0, r: 1 }, { freeze: 4.25 }] },
  S6: { take: 'S6/S6-take1.mp4', segs: [{ f: 1.0, t: 12.0, r: 2.2 }, { f: 12.0, t: 19.0, r: 2.4 }, { f: 19.0, t: 25.0, r: 3 }, { f: 25.0, t: 28.5, r: 1.2 }, { f: 28.5, t: 34.0, r: 3 }, { f: 34.0, t: 36.4, r: 1 }, { freeze: 4.6 }] },
  S7: { take: 'S7/S7-take1.mp4', segs: [{ f: 3.0, t: 24.35, r: 1 }] },
  S8: { take: 'S8/S8-take1.mp4', segs: [{ f: 0.8, t: 12.95, r: 1 }] },
}

const scenes = JSON.parse(readFileSync(join(root, 'src', 'scenes.json'), 'utf8')).scenes
const pub = join(root, 'public')
mkdirSync(pub, { recursive: true })

// merge Kokoro tokens into caption words: punctuation attaches to the previous word
const mergeWords = (raw) => {
  const out = []
  for (const t of raw) {
    if (/^[^\w]+$/.test(t.text) && out.length) { out.at(-1).text += t.text; out.at(-1).end = Math.max(out.at(-1).end, t.end); continue }
    out.push({ text: t.text, start: t.start, end: t.end })
  }
  return out
}

let cursor = 0
const timeline = []
for (const s of scenes) {
  const plan = PLAN[s.id]
  const wav = join(root, 'audio', `${s.id}.wav`)
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).stdout.toString()
  const narr = parseFloat(probe)
  let sceneT = 0
  const pills = []
  // build the filtergraph explicitly: each segment its own trim, freezes clone the previous segment's last frame
  const parts = []
  plan.segs.forEach((g, i) => {
    if (g.freeze) {
      const prev = plan.segs[i - 1]
      parts.push(`[0:v]trim=start=${(prev.t - 0.05).toFixed(3)}:end=${prev.t.toFixed(3)},setpts=PTS-STARTPTS,fps=30,tpad=stop_mode=clone:stop_duration=${g.freeze}[s${i}]`)
      sceneT += g.freeze
    } else {
      parts.push(`[0:v]trim=start=${g.f}:end=${g.t},setpts=(PTS-STARTPTS)/${g.r},fps=30[s${i}]`)
      const d = (g.t - g.f) / g.r
      if (g.r > 1.15) pills.push({ from: +sceneT.toFixed(2), to: +(sceneT + d).toFixed(2), text: `Sped up ${g.r}x` })
      sceneT += d
    }
  })
  const graph = parts.join(';') + ';' + plan.segs.map((_, i) => `[s${i}]`).join('') + `concat=n=${plan.segs.length}:v=1:a=0[out]`
  const out = join(pub, `${s.id}.mp4`)
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(root, 'capture', plan.take), '-filter_complex', graph, '-map', '[out]', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', out])
  if (r.status !== 0) throw new Error(`${s.id}: ${r.stderr}`)
  const dur = parseFloat(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).stdout.toString())
  const vp = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'json', out]).stdout.toString()).streams[0]
  if (dur < LEAD + narr + 0.1) console.warn(`WARN ${s.id}: scene ${dur.toFixed(2)}s is shorter than narration ${narr.toFixed(2)}s + lead`)
  copyFileSync(wav, join(pub, `${s.id}.wav`))
  const words = mergeWords(JSON.parse(readFileSync(join(root, 'audio', `${s.id}.words.json`), 'utf8'))).map((w) => ({ text: w.text, start: +(w.start + LEAD).toFixed(3), end: +(w.end + LEAD).toFixed(3) }))
  timeline.push({ id: s.id, start: +cursor.toFixed(3), dur: +dur.toFixed(3), lead: LEAD, narr: +narr.toFixed(3), width: vp.width, height: vp.height, pills, words })
  cursor += dur
  console.log(`${s.id}: ${dur.toFixed(2)}s (narration ${narr.toFixed(2)}s)`)
}
writeFileSync(join(root, 'src', 'timeline.json'), JSON.stringify({ total: +cursor.toFixed(3), scenes: timeline }, null, 1) + '\n')
console.log(`total ${cursor.toFixed(1)}s = ${Math.floor(cursor / 60)}:${String(Math.round(cursor % 60)).padStart(2, '0')}`)
