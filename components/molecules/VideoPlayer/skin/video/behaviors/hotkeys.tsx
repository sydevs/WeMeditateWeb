/** @jsxImportSource react */

import { Hotkey } from '@videojs/react'

import { PlaybackHotkeys } from './playback-hotkeys'

export interface VideoHotkeysProps {
  disabled?: boolean | undefined
}

export function VideoHotkeys({ disabled = false }: VideoHotkeysProps = {}) {
  return (
    <>
      <PlaybackHotkeys disabled={disabled} />
      <Hotkey action="toggleFullscreen" disabled={disabled} keys="f" />
      <Hotkey action="toggleSubtitles" disabled={disabled} keys="c" />
      <Hotkey action="togglePictureInPicture" disabled={disabled} keys="i" />
    </>
  )
}
