/** @jsxImportSource react */

import { Hotkey } from '@videojs/react'
import { use } from 'react'

// wm: a playback window rescales the percent keys, which these cannot (clip-window.tsx).
import { ClipHotkeys, ClipWindowContext } from '../../../clip-window'

export interface PlaybackHotkeysProps {
  disabled?: boolean | undefined
}

export function PlaybackHotkeys({ disabled = false }: PlaybackHotkeysProps = {}) {
  // wm: `null` leaves every hotkey below as the skin ships it.
  const clip = use(ClipWindowContext)

  return (
    <>
      <Hotkey action="togglePaused" disabled={disabled} keys="Space" />
      <Hotkey action="togglePaused" disabled={disabled} keys="k" />
      <Hotkey action="toggleMuted" disabled={disabled} keys="m" />
      <Hotkey action="seekStep" disabled={disabled} keys="ArrowRight" />
      <Hotkey action="seekStep" disabled={disabled} keys="ArrowLeft" />
      <Hotkey action="seekStep" disabled={disabled} keys="l" />
      <Hotkey action="seekStep" disabled={disabled} keys="j" />
      <Hotkey action="volumeStep" disabled={disabled} keys="ArrowUp" />
      <Hotkey action="volumeStep" disabled={disabled} keys="ArrowDown" />
      {/* wm: these three seek by a share of the media, which a window has to rescale. */}
      {clip ? (
        <ClipHotkeys disabled={disabled} window={clip} />
      ) : (
        <>
          <Hotkey action="seekToPercent" disabled={disabled} keys="0-9" />
          <Hotkey action="seekToPercent" disabled={disabled} keys="Home" value={0} />
          <Hotkey action="seekToPercent" disabled={disabled} keys="End" value={100} />
        </>
      )}
      <Hotkey action="speedUp" disabled={disabled} keys=">" />
      <Hotkey action="speedDown" disabled={disabled} keys="<" />
    </>
  )
}
