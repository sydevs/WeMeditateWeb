import { useCallback, useEffect, useState } from 'react'

/**
 * The two-way channel the CMS meditation frame editor drives.
 *
 * A meditation's "frames" are images pinned to timestamps. The editor shows
 * the real `/meditations/:id/embed` page in its panel and talks to it:
 *
 * - **inbound `SEEK_TO_TIME`** — an editor clicked a frame thumbnail, and the
 *   player should jump there
 * - **outbound `PLAYBACK_TIME_UPDATE`** — every 100ms while playing, plus on
 *   play, pause and seek; it is the timestamp a newly inserted frame is
 *   written at
 *
 * This is not Payload's live-preview protocol — no `payload-live-preview` type
 * tag, no document payload, nothing the SDK knows about. It is SahajCloud's
 * own channel, and it rides alongside the unsaved-edit stream in
 * `./messages.ts`.
 *
 * It lives here rather than inline in the embed page because the origin rules
 * below are the whole security surface of the channel, and a page component is
 * not where a reader looks for them.
 */

/** The message the frame editor sends when a thumbnail is clicked. */
const SEEK_MESSAGE = 'SEEK_TO_TIME'

/** The message this page sends back as the playhead moves. */
const PLAYBACK_MESSAGE = 'PLAYBACK_TIME_UPDATE'

/**
 * The timestamp a `SEEK_TO_TIME` message asks for, or `null` for anything else.
 *
 * ⚠ **Fails CLOSED when `cmsOrigin` is `undefined`.** An unset
 * `PUBLIC__SAHAJCLOUD_URL` must mean "accept nothing", never "accept
 * anything" — an earlier version compared against a `'*'` fallback, so a
 * missing environment variable let any page drive the playhead that timestamps
 * frames. `undefined` never equals `event.origin`, which is always a string,
 * so the comparison below is the closed answer rather than a second branch
 * that could be dropped.
 */
export function readSeekTimestamp(
  event: Pick<MessageEvent, 'origin' | 'data'>,
  cmsOrigin: string | undefined,
): number | null {
  if (!cmsOrigin || event.origin !== cmsOrigin) return null

  const data = event.data as { type?: unknown; timestamp?: unknown } | undefined

  if (data?.type !== SEEK_MESSAGE || typeof data.timestamp !== 'number') return null

  return data.timestamp
}

/** A seek request, keyed so the player re-runs on a repeat of the same second. */
export interface SeekRequest {
  timestamp: number
  /** `id` rather than the bare timestamp: seeking twice to 0:42 must still fire. */
  id: number
}

/**
 * Subscribes to the frame editor's seek requests and reports the playhead back.
 *
 * Both directions are inert unless `enabled` and a parseable CMS origin agree,
 * so the ordinary public embed attaches no listener and posts nothing.
 *
 * @param enabled - whether a live-preview session for this document is open
 * @param cmsOrigin - the CMS origin, from `cmsOrigin()` in `./session`
 */
export function useFrameEditorChannel(
  enabled: boolean,
  cmsOrigin: string | undefined,
): {
  seekTo: SeekRequest | undefined
  onPlaybackTimeUpdate: (currentTime: number) => void
} {
  const [seekTo, setSeekTo] = useState<SeekRequest | undefined>()

  useEffect(() => {
    if (!enabled || !cmsOrigin) return

    const onMessage = (event: MessageEvent) => {
      const timestamp = readSeekTimestamp(event, cmsOrigin)

      if (timestamp === null) return

      setSeekTo({ timestamp, id: Date.now() })
    }

    window.addEventListener('message', onMessage)

    return () => window.removeEventListener('message', onMessage)
  }, [enabled, cmsOrigin])

  const onPlaybackTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!enabled || !cmsOrigin) return
      // Not in a frame: nothing is listening, and `postMessage` to self would
      // be a message this very page then has to ignore.
      if (window.parent === window) return

      window.parent.postMessage(
        { type: PLAYBACK_MESSAGE, currentTime: Math.floor(currentTime) },
        // A named origin, never `'*'`: the playhead says what an editor is
        // watching, and it is posted on every tick.
        cmsOrigin,
      )
    },
    [enabled, cmsOrigin],
  )

  return { seekTo, onPlaybackTimeUpdate }
}
