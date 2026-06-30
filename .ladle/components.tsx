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

// The inline-size container makes `full-bleed` blocks (which size with `cqi`)
// resolve to the Ladle story area instead of the whole window — so they don't
// overflow under the sidebar. Inline style (not a Tailwind class) because Tailwind
// doesn't scan `.ladle/`. No `overflowX: clip` here — it would clip ContentTextBox's
// desktop overlap; blocks that bleed horizontally (OrnateTextBox) clip themselves.
export const Provider: GlobalProvider = ({ children }) => (
  <VikeReactProviderPageContext pageContext={ladlePageContext}>
    <div style={{ containerType: 'inline-size' }}>
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  </VikeReactProviderPageContext>
)
