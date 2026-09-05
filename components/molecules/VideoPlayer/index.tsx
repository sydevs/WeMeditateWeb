import React from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { VideoPlayerProps } from './VideoPlayer'

const VideoPlayerLazy = React.lazy(() =>
  import('./VideoPlayer').then((mod) => ({ default: mod.VideoPlayer })),
)

/**
 * A lightweight SSR-and-hydration fallback. This renders the poster, or an
 * empty placeholder, in the same container as the real player. Both the
 * fallback and the mounted player use a 16:9 box (the player sets
 * `aspectRatio="16/9"`), so the poster uses `object-cover` here, to keep
 * the frame congruent and avoid a layout shift on hydration, while it
 * gives an LCP image without loading the player.
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
 * The player, Vidstack and hls.js, needs browser media APIs. So, following
 * the LocationSearch and Mapbox pattern, ClientOnly and React.lazy load the
 * implementation only in the browser. This keeps Vidstack and hls.js out of
 * the SSR-and-Workers bundle entirely, not just lazy within it. The poster
 * renders as the server-side fallback.
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
