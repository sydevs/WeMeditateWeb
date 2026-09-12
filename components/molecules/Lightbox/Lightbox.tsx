'use client'

import YARLightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import type { LightboxSlide } from './LightboxProvider'
import { useT } from '../../../hooks/useT'

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
 * This is browser-only, because it imports the library and its CSS. So the
 * directory barrel loads it lazily behind `ClientOnly`, never statically,
 * to keep the library out of the SSR or Workers bundle.
 *
 * Captions render each slide's `description`. Zoom handles scroll,
 * double-click or tap, and pinch. Thumbnails and the previous and next
 * carousel matter only for multi-slide groups, so they drop for a single slide.
 */
export function Lightbox({ slides, open, index, close }: LightboxImplProps) {
  const t = useT()
  const single = slides.length <= 1
  const plugins = single ? [Captions, Zoom] : [Captions, Thumbnails, Zoom]

  return (
    <YARLightbox
      close={close}
      index={index}
      // The library renders its own controls, so its English defaults are
      // the only strings on this overlay a screen reader would otherwise
      // read. Its `labels` map is keyed by those defaults.
      labels={{
        Previous: t('common.a11y.previous'),
        Next: t('common.a11y.next'),
        Close: t('common.a11y.close'),
        'Zoom in': t('media.a11y.zoom_in'),
        'Zoom out': t('media.a11y.zoom_out'),
      }}
      open={open}
      plugins={plugins}
      // A single slide has nowhere to navigate, so this drops the previous
      // and next arrows. YARL would otherwise show them and wrap back to
      // the same image.
      render={single ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
      slides={slides}
      zoom={{ scrollToZoom: true }}
    />
  )
}
