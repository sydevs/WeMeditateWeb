import React from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { VideoPlayerProps } from './VideoPlayer'
import { BOUNDED_POSTER_SIZES, posterSrcSet, posterURL } from './poster'

const VideoPlayerLazy = React.lazy(() =>
  import('./VideoPlayer').then((mod) => ({ default: mod.VideoPlayer })),
)

/**
 * A lightweight SSR-and-hydration fallback. This renders the poster, or an
 * empty placeholder, in the same container as the real player. Both the
 * fallback and the mounted player use a 16:9 box — Video.js 10 ships no
 * default one, so `VideoPlayer` declares `aspect-video` on the skin to match
 * this — so the poster uses `object-cover` here, to keep the frame congruent
 * and avoid a layout shift on hydration, while it gives an LCP image without
 * loading the player. It is `loading="eager"` for that reason: this is the
 * only poster in the server HTML, and React 19 hoists a preload link for any
 * `<img>` that is not `loading="lazy"`.
 *
 * Unlike the mounted player's own poster, which takes a single URL, this
 * `<img>` carries the whole video ladder, so the width follows the box and the
 * device pixel ratio.
 */
function VideoPlayerFallback({
  poster,
  posterSizes = BOUNDED_POSTER_SIZES,
  className,
}: Pick<VideoPlayerProps, 'poster' | 'posterSizes' | 'className'>) {
  const srcSet = posterSrcSet(poster)

  return (
    <div className={`relative w-full overflow-hidden rounded-lg bg-black ${className ?? ''}`}>
      {poster ? (
        <img
          alt=""
          className="aspect-video w-full object-cover"
          loading="eager"
          sizes={srcSet ? posterSizes : undefined}
          src={posterURL(poster)}
          srcSet={srcSet}
        />
      ) : (
        <div className="aspect-video w-full" />
      )}
    </div>
  )
}

/**
 * Client-only wrapper around the HLS player.
 *
 * The player, Video.js and the hls.js engine it bundles, needs browser media
 * APIs. So, following the LocationSearch and Mapbox pattern, ClientOnly and
 * React.lazy load the implementation only in the browser. This keeps Video.js
 * out of the SSR-and-Workers bundle entirely, not just lazy within it. The
 * poster renders as the server-side fallback.
 */
export function VideoPlayer(props: VideoPlayerProps) {
  if (!props.hlsUrl) {
    return null
  }

  return (
    <ClientOnly
      fallback={
        <VideoPlayerFallback
          className={props.className}
          poster={props.poster}
          posterSizes={props.posterSizes}
        />
      }
    >
      <VideoPlayerLazy {...props} />
    </ClientOnly>
  )
}

export type { VideoPlayerProps } from './VideoPlayer'
export { cuesToVtt, msToVttTimestamp, type VideoSubtitleCue } from './vtt'
