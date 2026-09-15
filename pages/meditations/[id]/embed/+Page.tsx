import { useCallback, useEffect, useState } from 'react'
import { useData } from 'vike-react/useData'
import { usePageContext } from 'vike-react/usePageContext'

import type { MeditationEmbedPageData } from './+data'
import { MeditationTemplate } from '../../../../components/templates'
import { cmsOrigin, useLivePreviewMessages } from '../../../../hooks/useLivePreviewMessages'

/**
 * Meditation embed page (/meditations/:id/embed) — designed for iframe
 * embedding. Bare by construction: it sets no Layout, so it inherits only the
 * global LayoutRoot (no Header/Footer/nav). It hides the Embed button, because
 * it is already inside an iframe, to avoid embed-in-embed.
 *
 * ## It is also what the CMS frame editor points at
 *
 * This used to be `/preview/embed`, a second renderer kept approximately equal
 * to this one. The frame editor drives a two-way `postMessage` channel with
 * whatever is in the panel:
 *
 * - **inbound `SEEK_TO_TIME`** — an editor clicked a frame thumbnail
 * - **outbound `PLAYBACK_TIME_UPDATE`** — every 100ms while playing, plus on
 *   play, pause and seek; it is the timestamp a newly inserted frame is
 *   written at
 *
 * Both are gated on the CMS origin, and both fail CLOSED when it is unset. The
 * version this replaced compared against a `'*'` fallback on the inbound side,
 * so an unset environment variable let any page drive the playhead that
 * timestamps frames.
 */
export function Page() {
  const { meditation: initialMeditation, musicTracks } = useData<MeditationEmbedPageData>()
  const pageContext = usePageContext()

  const origin = cmsOrigin()
  const active = pageContext.livePreview?.active === true

  const meditation = useLivePreviewMessages({
    initialData: initialMeditation,
    serverOrigin: origin,
    slug: 'meditations',
    active: active && pageContext.livePreview?.scope === null,
  })

  // `id` rather than the bare timestamp: seeking twice to the same second must
  // still fire, and the player keys its effect on it.
  const [seekTo, setSeekTo] = useState<{ timestamp: number; id: number } | undefined>()

  useEffect(() => {
    if (!active || !origin) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return

      const data = event.data as { type?: unknown; timestamp?: unknown } | undefined

      if (data?.type !== 'SEEK_TO_TIME' || typeof data.timestamp !== 'number') return

      setSeekTo({ timestamp: data.timestamp, id: Date.now() })
    }

    window.addEventListener('message', handleMessage)

    return () => window.removeEventListener('message', handleMessage)
  }, [active, origin])

  const handlePlaybackTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!active || !origin) return
      if (window.parent === window) return

      window.parent.postMessage(
        { type: 'PLAYBACK_TIME_UPDATE', currentTime: Math.floor(currentTime) },
        origin,
      )
    },
    [active, origin],
  )

  return (
    <MeditationTemplate
      meditation={meditation}
      musicTracks={musicTracks}
      seekTo={seekTo}
      showEmbedButton={false}
      timeDisplay={active ? 'elapsed' : undefined}
      onPlaybackTimeUpdate={active ? handlePlaybackTimeUpdate : undefined}
    />
  )
}
