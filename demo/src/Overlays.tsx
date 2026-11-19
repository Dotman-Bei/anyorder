import React from 'react'
import { c, sans, mono, BADGE, PITCH, REPO } from './theme'

// Persistent corner badge: on for the whole video.
export const Badge: React.FC = () => (
  <div
    style={{
      position: 'absolute', top: 36, right: 48, padding: '10px 20px', fontFamily: mono, fontSize: 24,
      color: c.text, background: c.bar, border: `1px solid ${c.line}`, letterSpacing: 0.3,
    }}
  >
    {BADGE}
  </div>
)

// Word-timed caption bar. `words` is the visible chunk, `active` the word being spoken.
export const CaptionBar: React.FC<{ words: string[]; active: number }> = ({ words, active }) => (
  <div
    style={{
      position: 'absolute', left: 160, right: 160, bottom: 64, padding: '22px 36px', background: c.bar,
      border: `1px solid ${c.line}`, fontFamily: sans, fontSize: 46, lineHeight: 1.3, color: c.text,
      textAlign: 'center', minHeight: 60,
    }}
  >
    {words.map((w, i) => (
      <span key={i} style={{ color: i === active ? c.bronze : c.text, fontWeight: i === active ? 700 : 500 }}>
        {w}{i < words.length - 1 ? ' ' : ''}
      </span>
    ))}
  </div>
)

// S1's title overlay: the exact pitch sentence.
export const PitchCard: React.FC = () => (
  <div
    style={{
      position: 'absolute', left: 160, right: 160, top: 250, padding: '44px 56px', background: c.bar,
      border: `1px solid ${c.bronze}`, fontFamily: sans, color: c.text,
    }}
  >
    <div style={{ fontFamily: mono, fontSize: 26, color: c.bronze, letterSpacing: 2, marginBottom: 18 }}>ANYORDER</div>
    <div style={{ fontSize: 56, lineHeight: 1.25, fontWeight: 600 }}>{PITCH}</div>
  </div>
)

// S8's tail: closing disclosure and repo text (no QR) as a lower strip, so the real /app footer
// footage (with the two `fe test` commands) stays visible above it.
export const OutroCard: React.FC = () => (
  <div
    style={{
      position: 'absolute', left: 160, right: 160, bottom: 250, padding: '18px 36px', background: c.bar,
      border: `1px solid ${c.bronze}`, fontFamily: sans, color: c.text,
    }}
  >
    <div style={{ fontSize: 32, lineHeight: 1.3, fontWeight: 600 }}>
      Ran on a local Anvil chain: dev accounts, test funds, a book seeded by the setup script. Not a live market.
      Unaudited prototype.
    </div>
    <div style={{ fontFamily: mono, fontSize: 34, color: c.bronze, marginTop: 10 }}>{REPO}</div>
  </div>
)
