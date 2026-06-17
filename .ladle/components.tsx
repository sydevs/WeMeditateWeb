import { Suspense } from 'react'
import type { GlobalProvider } from '@ladle/react'
import { VikeReactProviderPageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'
import '../layouts/fonts.css'
import '../layouts/style.css'
import '../layouts/tailwind.css'

// Ladle isn't a Vike app, so vike-react's runtime `pageContext` and the app-root
// <Suspense> boundary don't exist. Components that read `usePageContext()` or use
// the `ClientOnly` + `React.lazy` pattern (the Lightbox / VideoPlayer / LocationSearch
// wrappers) need both — without them `ClientOnly` throws on `pageContext.isClientSide`
// and a lazy child suspends with no boundary. Supply a minimal client-side
// pageContext and a Suspense boundary here, mirroring what Vike provides at runtime.
const ladlePageContext = { isClientSide: true, locale: 'en' } as unknown as PageContext

export const Provider: GlobalProvider = ({ children }) => (
  <VikeReactProviderPageContext pageContext={ladlePageContext}>
    <Suspense fallback={null}>{children}</Suspense>
  </VikeReactProviderPageContext>
)
