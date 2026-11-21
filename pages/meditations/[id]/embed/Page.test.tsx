/**
 * Named without the `+` its subject carries. Vike loads every `+`-prefixed
 * file under `pages/` as a config file, and rejects one that exports no
 * `route` and no `default`. That failure shows up in the build, not the test
 * run. This test still lives next to its subject.
 *
 * It renders the real template and player, because the prop is the whole
 * change: a test that asserted on a stubbed template would pass with the
 * player's upsell block deleted.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import type { Meditation } from '@/types/sahajcloud'

const meditation = {
  id: 7,
  title: 'Morning Meditation',
  url: 'https://example.com/voice.mp3',
  durationMinutes: 10,
  thumbnail: null,
  frames: null,
} as unknown as Meditation

vi.mock('vike-react/useData', () => ({
  useData: () => ({ meditation, musicTracks: [] }),
}))

// The two postMessage channels are the preview transport, not this route's
// rendering. Stub them so the render needs no `window` and no live session.
vi.mock('@/lib/live-preview/document', () => ({
  LivePreviewDocument: ({
    initialData,
    children,
  }: {
    initialData: Meditation
    children: (meditation: Meditation) => ReactNode
  }) => children(initialData),
}))
vi.mock('@/lib/live-preview/frame-editor', () => ({
  useFrameEditorChannel: () => ({ seekTo: null, onPlaybackTimeUpdate: undefined }),
}))
vi.mock('@/lib/live-preview/session', () => ({
  sahajCloudOrigin: () => null,
  useDocumentPreviewActive: () => false,
}))

const { Page } = await import('./+Page')

describe('the meditation embed route', () => {
  it('closes the player with the web upsell line', () => {
    const html = renderToStaticMarkup(<Page />)

    expect(html).toContain('Find more meditations on')
    expect(html).toContain('href="https://wemeditate.com/meditations"')
  })

  it('offers the app variant nowhere, so the embed never points at the store', () => {
    const html = renderToStaticMarkup(<Page />)

    expect(html).not.toContain('free app')
  })
})
