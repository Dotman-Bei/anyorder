import React from 'react'
import { Still } from 'remotion'
import { Storyboard } from './Storyboard'
import { W, H } from './theme'
import scenesJson from './scenes.json'

export const Root: React.FC = () => (
  <>
    {scenesJson.scenes.map((s) => (
      <Still key={s.id} id={`SB-${s.id}`} component={Storyboard} width={W} height={H} defaultProps={{ id: s.id }} />
    ))}
  </>
)
