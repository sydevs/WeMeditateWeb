import { createContext, use } from 'react'

/**
 * The contract between the `Image` atom, which registers slides, and the
 * `LightboxProvider` molecule, which collects them and draws the overlay.
 *
 * It sits with the atom so the molecule imports downward. Like the provider,
 * it never imports the browser-only lightbox package: only the lazy
 * `Lightbox` implementation does.
 */

/**
 * A single lightbox slide.
 *
 * This is structurally a subset of the library's `SlideImage`, plus the
 * Captions plugin's `description`.
 */
export interface LightboxSlide {
  /** Full-resolution image URL (largest Cloudflare variant for SahajCloud images). */
  src: string
  /** Accessible alt text, mirrored into the caption. */
  alt?: string
  /** Caption text shown by the Captions plugin. */
  description?: string
}

export interface LightboxContextValue {
  /** Register (or replace) a slide in a group at its document-order index. */
  register: (group: string, index: number, slide: LightboxSlide) => void
  /** Remove a slide when its `Image` unmounts. */
  unregister: (group: string, index: number) => void
  /** Open the lightbox for `group` on the slide at `index`. */
  openAt: (group: string, index: number) => void
}

export const LightboxContext = createContext<LightboxContextValue | null>(null)

/**
 * Access the ambient lightbox controller, or `null` when no
 * `LightboxProvider` is mounted — letting the `Image` atom degrade to
 * plain, non-interactive rendering.
 */
export function useLightbox(): LightboxContextValue | null {
  return use(LightboxContext)
}
