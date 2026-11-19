import type { ReactNode } from 'react'

export interface ImageCreditProps {
  /** The image's `credit`, as SahajCloud stores it. */
  children: ReactNode
  className?: string
}

/**
 * An image's attribution, under the image: the slot the legacy site's
 * `.cb-image-media__credit` filled, shared by an uploaded figure and a gallery
 * tile so the two print it alike. `<small>` is the element for attribution.
 * The legacy grey (`gray-400`) fails AA on white, so this takes the muted
 * surface token instead.
 */
export function ImageCredit({ children, className }: ImageCreditProps) {
  return (
    <small
      className={['block text-sm tracking-wide text-fg-muted', className].filter(Boolean).join(' ')}
    >
      {children}
    </small>
  )
}
