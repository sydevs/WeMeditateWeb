import React from 'react'
import { ClientOnly } from 'vike-react/ClientOnly'
import type { LightboxImplProps } from './Lightbox'

const LightboxLazy = React.lazy(() =>
  import('./Lightbox').then((mod) => ({ default: mod.Lightbox })),
)

/**
 * Worker-safe lightbox overlay.
 *
 * `ClientOnly` and `React.lazy` load the implementation, and the
 * browser-only `yet-another-react-lightbox` library it pulls in, only in
 * the browser. So it never enters the SSR or Workers bundle, mirroring the
 * VideoPlayer and LocationSearch pattern. It renders nothing on the server.
 * Callers, the `LightboxProvider`, mount it only once a slide group is open.
 */
export function Lightbox(props: LightboxImplProps) {
  return (
    <ClientOnly fallback={null}>
      <LightboxLazy {...props} />
    </ClientOnly>
  )
}

export type { LightboxImplProps } from './Lightbox'
