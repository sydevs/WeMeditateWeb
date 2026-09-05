import React from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { EmbedButtonProps } from './EmbedButton'

const EmbedButtonLazy = React.lazy(() =>
  import('./EmbedButton').then((mod) => ({ default: mod.EmbedButton })),
)

/**
 * Client-only wrapper around EmbedButton.
 *
 * The button reads `window.location.origin` and the Clipboard API. So,
 * like VideoPlayer and LocationSearch, the implementation loads only in
 * the browser, through ClientOnly and React.lazy. It renders nothing
 * during SSR. It needs no fallback, because it is supplementary player
 * chrome, not content.
 */
export function EmbedButton(props: EmbedButtonProps) {
  return (
    <ClientOnly fallback={null}>
      <EmbedButtonLazy {...props} />
    </ClientOnly>
  )
}

export type { EmbedButtonProps } from './EmbedButton'
