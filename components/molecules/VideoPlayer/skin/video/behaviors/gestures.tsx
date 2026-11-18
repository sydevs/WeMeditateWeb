/** @jsxImportSource react */

import { Gesture } from '@videojs/react'

export interface VideoGesturesProps {
  disabled?: boolean | undefined
}

export function VideoGestures({ disabled = false }: VideoGesturesProps = {}) {
  return (
    <>
      <Gesture
        action="togglePaused"
        disabled={disabled}
        pointer="mouse"
        region="center"
        type="tap"
      />
      <Gesture action="toggleControls" disabled={disabled} pointer="touch" type="tap" />
      <Gesture action="seekStep" disabled={disabled} region="left" type="doubletap" />
      <Gesture action="toggleFullscreen" disabled={disabled} region="center" type="doubletap" />
      <Gesture action="seekStep" disabled={disabled} region="right" type="doubletap" />
    </>
  )
}
