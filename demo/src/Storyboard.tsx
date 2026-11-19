import React from 'react'
import { AbsoluteFill } from 'remotion'
import { c, sans, mono, W, H } from './theme'
import { Badge, CaptionBar, PitchCard, OutroCard } from './Overlays'
import scenesJson from './scenes.json'

export type Scene = (typeof scenesJson.scenes)[number]

// First ~2 lines of the scene's real narration; one word highlighted to show the active-word style.
const chunk = (text: string, max = 96): string[] => {
  const out: string[] = []
  let len = 0
  for (const w of text.split(/\s+/)) {
    if (len + w.length + 1 > max) break
    out.push(w)
    len += w.length + 1
  }
  return out
}

export const Storyboard: React.FC<{ id: string }> = ({ id }) => {
  const s = scenesJson.scenes.find((x) => x.id === id)
  if (!s) throw new Error(`unknown scene ${id}`)
  const words = chunk(s.narration)
  return (
    <AbsoluteFill style={{ background: c.ground, fontFamily: sans, color: c.text }}>
      {/* the footage slot: empty in the storyboard, full-frame in the cut */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(135deg, ${c.slot} 0 28px, ${c.ground} 28px 56px)`,
          border: `2px dashed ${c.line}`, margin: 24, width: W - 48, height: H - 48,
        }}
      />
      <div style={{ position: 'absolute', left: 64, top: 40, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ background: c.bronze, color: '#101110', fontFamily: mono, fontWeight: 700, fontSize: 34, padding: '6px 18px' }}>{s.id}</div>
        <div style={{ fontFamily: mono, fontSize: 28, color: c.muted }}>{s.seconds} s planned · driver: {s.driver}</div>
      </div>
      <div style={{ position: 'absolute', left: 64, right: 64, top: s.id === 'S1' ? 660 : s.id === 'S8' ? 300 : 420, textAlign: 'center' }}>
        <div style={{ fontFamily: mono, fontSize: 24, color: c.bronze, letterSpacing: 3, marginBottom: 16 }}>FOOTAGE SLOT (STORYBOARD, NOT RECORDED)</div>
        <div style={{ fontSize: 34, lineHeight: 1.35, color: c.muted, maxWidth: 1500, margin: '0 auto' }}>{s.visual}</div>
      </div>
      {s.id === 'S1' && <PitchCard />}
      {s.id === 'S8' && <OutroCard />}
      <Badge />
      <CaptionBar words={words} active={Math.min(3, words.length - 1)} />
    </AbsoluteFill>
  )
}
