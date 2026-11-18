/** @jsxImportSource react */

import { Hotkey } from '@videojs/react'

export interface PlaybackHotkeysProps {
  disabled?: boolean | undefined
}

export function PlaybackHotkeys({ disabled = false }: PlaybackHotkeysProps = {}) {
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
      <Hotkey action="seekToPercent" disabled={disabled} keys="0-9" />
      <Hotkey action="seekToPercent" disabled={disabled} keys="Home" value={0} />
      <Hotkey action="seekToPercent" disabled={disabled} keys="End" value={100} />
      <Hotkey action="speedUp" disabled={disabled} keys=">" />
      <Hotkey action="speedDown" disabled={disabled} keys="<" />
    </>
  )
}
