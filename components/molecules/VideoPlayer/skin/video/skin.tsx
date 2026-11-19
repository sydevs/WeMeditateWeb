/** @jsxImportSource react */

'use client'

// wm: the skin's Tailwind root, here rather than in the site entry so the `media-*` layer
// rides this chunk (../styles/skin-theme.css).
import '../styles/skin-theme.css'
import '../styles/video/base.css'
import type { ComponentProps, ReactNode } from 'react'

import { BufferingIndicator } from '../ui/buffering-indicator'
import { Container } from '../ui/container'
import { ErrorDialog } from '../ui/error-dialog'
import { Poster } from '../ui/poster'
import { Title } from '../ui/title'
import { cn } from '../lib/resolve-class-name'

import { VideoGestures } from './behaviors/gestures'
import { VideoHotkeys } from './behaviors/hotkeys'
import { VideoStatusIndicators } from './display/status-indicators'
import { DefaultVideoControls } from './layout/controls'

export interface VideoSkinProps extends Omit<
  NonNullable<ComponentProps<typeof Container>>,
  'children'
> {
  children?: ReactNode
  renderPoster?: NonNullable<ComponentProps<typeof Poster>>['renderImage']
  renderThumbnail?: NonNullable<ComponentProps<typeof DefaultVideoControls>>['renderThumbnail']
}

export function VideoSkin({
  children,
  className,
  renderPoster,
  renderThumbnail,
  ...props
}: VideoSkinProps = {}) {
  return (
    <Container
      className={cn('pointer-fine:not-data-controls-visible:cursor-none', className)}
      data-preset="video"
      data-theme="default"
      {...props}
    >
      {children}
      <Poster renderImage={renderPoster} />
      <BufferingIndicator />
      <ErrorDialog />
      <Title />

      <DefaultVideoControls renderThumbnail={renderThumbnail} />

      <VideoHotkeys />
      <VideoGestures />
      <VideoStatusIndicators />
    </Container>
  )
}
