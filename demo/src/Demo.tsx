import React from 'react'
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { c, sans, mono, FPS, W, H, PITCH, REPO } from './theme'
import timelineJson from './timeline.json'

type Word = { text: string; start: number; end: number }
type Scene = (typeof timelineJson.scenes)[number]

// Caption chunks: break at sentence ends or after 8 words, so two lines at most.
const chunks = (words: Word[]): Word[][] => {
  const out: Word[][] = []
  let cur: Word[] = []
  for (const w of words) {
    cur.push(w)
    if (/[.:;]$/.test(w.text) || cur.length >= 8) { out.push(cur); cur = [] }
  }
  if (cur.length) out.push(cur)
  return out
}

const Captions: React.FC<{ words: Word[]; t: number }> = ({ words, t }) => {
  const cs = chunks(words)
  let idx = -1
  for (let i = 0; i < cs.length; i++) if (t >= cs[i][0].start - 0.05) idx = i
  if (idx < 0 || t > cs[idx].at(-1)!.end + 0.6) return null
  const chunk = cs[idx]
  let active = -1
  chunk.forEach((w, i) => { if (t >= w.start) active = i })
  return (
    <div style={{ position: 'absolute', left: 160, right: 160, bottom: 64, padding: '22px 36px', background: c.bar, border: `1px solid ${c.line}`, fontFamily: sans, fontSize: 46, lineHeight: 1.3, color: c.text, textAlign: 'center' }}>
      {chunk.map((w, i) => (
        <span key={i} style={{ color: i === active ? c.bronze : c.text, fontWeight: i === active ? 700 : 500 }}>{w.text}{i < chunk.length - 1 ? ' ' : ''}</span>
      ))}
    </div>
  )
}

// Persistent badge: bottom strip, so it never covers the page's own controls.
const BadgeBottom: React.FC = () => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center' }}>
    <span style={{ display: 'inline-block', padding: '6px 22px', fontFamily: mono, fontSize: 22, color: c.text, background: 'rgba(8,9,8,0.92)', border: `1px solid ${c.line}` }}>Local Anvil chain 31337 · test funds · not a live market</span>
  </div>
)

const Pill: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: 'absolute', left: 40, top: 40, padding: '8px 18px', background: c.bar, border: `1px solid ${c.bronze}`, color: c.bronze, fontFamily: mono, fontSize: 26 }}>{text}</div>
)

const fade = (t: number, a: number, b: number, f = 0.4) => interpolate(t, [a, a + f, b - f, b], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

const wordAt = (s: Scene, text: string, nth = 0) => s.words.filter((w) => w.text.toLowerCase().replace(/[.,:;]$/, '') === text)[nth]?.start

// S3: what the tests assert, restated beside the real terminal. Labelled as an overlay, figures from the README table.
const S3Card: React.FC<{ s: Scene; t: number }> = ({ s, t }) => {
  const rows = [
    { at: wordAt(s, '0.00809')! - 0.5, k: 'Pool sandwich: attacker profit', v: '0.008090638930163447 ETH' },
    { at: wordAt(s, '0.011')! - 0.4, k: 'Batch price, alone and sandwiched', v: '0.011 ETH per TKN' },
    { at: wordAt(s, '0.165')! - 0.8, k: 'Victim, alone and sandwiched', v: '15 TKN for 0.165 ETH' },
    { at: wordAt(s, 'minus')! - 0.2, k: 'Attacker in the batch', v: '0 TKN and -1 wei' },
  ]
  const perm = wordAt(s, 'permutation')! - 0.3
  const base: React.CSSProperties = { position: 'absolute', left: 1490, top: 110, width: 402, padding: '20px 22px', background: c.bar, border: `1px solid ${c.bronze}`, fontFamily: sans, color: c.text }
  if (t >= perm) {
    return (
      <div style={{ ...base, opacity: fade(t, perm, s.dur, 0.3) }}>
        <div style={{ fontFamily: mono, fontSize: 20, color: c.bronze, letterSpacing: 1.5, marginBottom: 14 }}>PERMUTATION TESTS</div>
        <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.25 }}>256 shuffles of the pure rule</div>
        <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.25, marginTop: 10 }}>2 x 128 shuffled interleavings at contract level</div>
        <div style={{ fontFamily: mono, fontSize: 24, color: c.bronze, marginTop: 16 }}>same price, same per-owner fills</div>
      </div>
    )
  }
  if (t < rows[0].at) return null
  return (
    <div style={{ ...base, opacity: fade(t, rows[0].at, perm, 0.3) }}>
      <div style={{ fontFamily: mono, fontSize: 20, color: c.bronze, letterSpacing: 1.5, marginBottom: 14 }}>ASSERTED BY THESE TESTS</div>
      {rows.map((r, i) => t >= r.at && (
        <div key={i} style={{ marginBottom: 16, opacity: interpolate(t, [r.at, r.at + 0.35], [0, 1], { extrapolateRight: 'clamp' }) }}>
          <div style={{ fontSize: 21, color: c.muted }}>{r.k}</div>
          <div style={{ fontFamily: mono, fontSize: i === 0 ? 24 : 30, fontWeight: 700 }}>{r.v}</div>
        </div>
      ))}
      <div style={{ fontSize: 17, color: c.muted, lineHeight: 1.35, marginTop: 6 }}>Overlay text. Figures are from the README table, computed by ref/clearing_ref.py and asserted by the tests. The next scene shows them live.</div>
    </div>
  )
}

const SceneView: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame()
  const t = frame / FPS
  const file = staticFile(`${s.id}.mp4`)
  const pill = s.pills.find((p) => t >= p.from && t < p.to)
  let video: React.ReactNode
  if (s.id === 'S3') {
    const k = 0.8
    video = <div style={{ position: 'absolute', left: 28, top: 60, width: s.width * k, height: s.height * k, border: `1px solid ${c.line}` }}>
      <OffthreadVideo src={file} style={{ width: s.width * k, height: s.height * k }} muted />
    </div>
  } else if (s.id === 'S5') {
    const z = interpolate(t, [1, 4.5], [1, 1.45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => x * x * (3 - 2 * x) })
    video = <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: '1290px 745px' }}><OffthreadVideo src={file} style={{ width: W, height: H }} muted /></AbsoluteFill>
  } else if (s.id === 'S7') {
    const ease = (x: number) => x * x * (3 - 2 * x)
    const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
    const right = t < 13.8
    const z = right
      ? interpolate(t, [3.2, 6, 13, 13.8], [1, 1.55, 1.55, 1], { ...clamp, easing: ease })
      : interpolate(t, [14.6, 16.2], [1, 1.35], { ...clamp, easing: ease })
    video = <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: right ? '1330px 470px' : '690px 500px' }}><OffthreadVideo src={file} style={{ width: W, height: H }} muted /></AbsoluteFill>
  } else {
    video = <OffthreadVideo src={file} style={{ width: W, height: H }} muted />
  }
  return (
    <AbsoluteFill style={{ background: c.ground }}>
      {video}
      <Sequence from={Math.round(s.lead * FPS)}><Audio src={staticFile(`${s.id}.wav`)} /></Sequence>
      {s.id === 'S1' && (
        <div style={{ position: 'absolute', left: 160, right: 160, top: 250, padding: '44px 56px', background: '#0b0d0b', border: `1px solid ${c.bronze}`, fontFamily: sans, color: c.text, opacity: fade(t, 0.3, 7.8, 0.5) }}>
          <div style={{ fontFamily: mono, fontSize: 26, color: c.bronze, letterSpacing: 2, marginBottom: 18 }}>ANYORDER</div>
          <div style={{ fontSize: 56, lineHeight: 1.25, fontWeight: 600 }}>{PITCH}</div>
        </div>
      )}
      {s.id === 'S3' && <S3Card s={s} t={t} />}
      {s.id === 'S8' && t > 4.6 && (
        <div style={{ position: 'absolute', left: 160, right: 160, bottom: 250, padding: '18px 36px', background: c.bar, border: `1px solid ${c.bronze}`, fontFamily: sans, color: c.text, opacity: interpolate(t, [4.6, 5.1], [0, 1], { extrapolateRight: 'clamp' }) }}>
          <div style={{ fontSize: 32, lineHeight: 1.3, fontWeight: 600 }}>Ran on a local Anvil chain: dev accounts, test funds, a book seeded by the setup script. Not a live market. Unaudited prototype.</div>
          <div style={{ fontFamily: mono, fontSize: 34, color: c.bronze, marginTop: 10 }}>{REPO}</div>
        </div>
      )}
      {pill && <Pill text={s.id === 'S3' ? `Compile wait ${pill.text.toLowerCase()}` : pill.text} />}
      <BadgeBottom />
      <Captions words={s.words} t={t} />
    </AbsoluteFill>
  )
}

export const Demo: React.FC = () => (
  <AbsoluteFill style={{ background: c.ground }}>
    {timelineJson.scenes.map((s) => (
      <Sequence key={s.id} from={Math.round(s.start * FPS)} durationInFrames={Math.round(s.dur * FPS)}>
        <SceneView s={s} />
      </Sequence>
    ))}
  </AbsoluteFill>
)

export const TOTAL_FRAMES = Math.round(timelineJson.total * FPS)
