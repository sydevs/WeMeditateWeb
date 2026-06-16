import React from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { LightboxImplProps } from './Lightbox'

const LightboxLazy = React.lazy(() =>
  import('./Lightbox').then((mod) => ({ default: mod.Lightbox })),
)

/**
 * Worker-safe lightbox overlay.
 *
 * The implementation — and the browser-only `yet-another-react-lightbox`
 * library it pulls in — is loaded only in the browser via `ClientOnly` +
 * `React.lazy`, so it never enters the SSR / Workers bundle (mirroring the
 * VideoPlayer / LocationSearch pattern). Renders nothing on the server; callers
 * (the `LightboxProvider`) mount it only once a slide group is open.
 */
export function Lightbox(props: LightboxImplProps) {
  return (
    <ClientOnly fallback={null}>
      <LightboxLazy {...props} />
    </ClientOnly>
  )
}

export type { LightboxImplProps } from './Lightbox'
