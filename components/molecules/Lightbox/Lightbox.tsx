'use client'

import YARLightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import type { LightboxSlide } from './LightboxProvider'

export interface LightboxImplProps {
  /** Slides to display, in navigation order. */
  slides: LightboxSlide[]
  /** Whether the overlay is open. */
  open: boolean
  /** Index of the initially-shown slide. */
  index: number
  /** Called when the user dismisses the lightbox (Esc, backdrop, close button). */
  close: () => void
}

/**
 * Full-screen image lightbox wrapping `yet-another-react-lightbox`.
 *
 * Browser-only (it imports the library and its CSS), so it is loaded lazily
 * behind `ClientOnly` via the directory barrel — never statically — to keep the
 * library out of the SSR / Workers bundle.
 *
 * Captions render each slide's `description`; Zoom handles scroll, double-click/
 * tap and pinch. Thumbnails and the prev/next carousel are only meaningful for
 * multi-slide groups, so they are dropped for a single slide.
 */
export function Lightbox({ slides, open, index, close }: LightboxImplProps) {
  const plugins = slides.length > 1 ? [Captions, Thumbnails, Zoom] : [Captions, Zoom]

  return (
    <YARLightbox
      close={close}
      index={index}
      open={open}
      plugins={plugins}
      slides={slides}
      zoom={{ scrollToZoom: true }}
    />
  )
}
