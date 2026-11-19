import React from 'react'
import { Composition, Still } from 'remotion'
import { Demo, TOTAL_FRAMES } from './Demo'
import { Storyboard } from './Storyboard'
import { W, H, FPS } from './theme'
import scenesJson from './scenes.json'

export const Root: React.FC = () => (
  <>
    <Composition id="Demo" component={Demo} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    {scenesJson.scenes.map((s) => (
      <Still key={s.id} id={`SB-${s.id}`} component={Storyboard} width={W} height={H} defaultProps={{ id: s.id }} />
    ))}
  </>
)
