import React from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { VideoPlayerProps } from './VideoPlayer'

const VideoPlayerLazy = React.lazy(() =>
  import('./VideoPlayer').then((mod) => ({ default: mod.VideoPlayer })),
)

/**
 * Lightweight SSR/hydration fallback: renders the poster (or an empty
 * placeholder) in the same container as the real player. Both the fallback and
 * the mounted player use a 16:9 box (the player sets `aspectRatio="16/9"`), so
 * the poster is `object-cover` here to keep the frame congruent and avoid a
 * layout shift on hydration, while giving an LCP image without loading the player.
 */
function VideoPlayerFallback({
  poster,
  className,
}: Pick<VideoPlayerProps, 'poster' | 'className'>) {
  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-black ${className ?? ''}`}>
      {poster ? (
        <img alt="" className="aspect-video w-full object-cover" src={poster} />
      ) : (
        <div className="aspect-video w-full" />
      )}
    </div>
  )
}

/**
 * Client-only wrapper around the HLS player.
 *
 * The player (Vidstack + hls.js) needs browser media APIs, so — following the
 * LocationSearch/mapbox pattern — the implementation is loaded only in the
 * browser via ClientOnly + React.lazy. This keeps Vidstack and hls.js out of the
 * SSR/Workers bundle entirely (not just lazy within it). The poster renders as
 * the server-side fallback.
 */
export function VideoPlayer(props: VideoPlayerProps) {
  if (!props.hlsUrl) {
    return null
  }

  return (
    <ClientOnly
      fallback={<VideoPlayerFallback className={props.className} poster={props.poster} />}
    >
      <VideoPlayerLazy {...props} />
    </ClientOnly>
  )
}

export type { VideoPlayerProps } from './VideoPlayer'
export { cuesToVtt, msToVttTimestamp, type VideoSubtitleCue } from './vtt'
