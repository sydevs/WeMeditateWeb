import { Suspense, type CSSProperties } from 'react'
import type { GlobalProvider } from '@ladle/react'
import { VikeReactProviderPageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'
import '../layouts/fonts.css'
import '../layouts/style.css'
import '../layouts/tailwind.css'
import './story-overrides.css'

// Ladle is not a Vike app. It has no runtime `pageContext` from vike-react and
// no app-root <Suspense> boundary. Components that call `usePageContext()`, or
// use the `ClientOnly` + `React.lazy` pattern (the Lightbox, VideoPlayer, and
// LocationSearch wrappers), need both. Without them, `ClientOnly` throws on
// `pageContext.isClientSide`, and a lazy child suspends with no boundary.
// This code supplies a minimal client-side pageContext and a Suspense
// boundary, to mirror what Vike provides at runtime.
const ladlePageContext = { isClientSide: true, locale: 'en' } as unknown as PageContext

// The inline-size container makes `full-bleed` blocks resolve against the
// Ladle story area, not the whole window, so they do not overflow under the
// sidebar. The inner wrapper captures that area's width into `--page-width`
// (`100cqi`), mirroring the page-content wrapper in LayoutChrome. This makes
// full-bleed read the same captured length here as on real pages. These are
// inline styles, not Tailwind classes, because Tailwind does not scan
// `.ladle/`. There is no `overflowX: clip` here. That would clip
// ContentTextBox's desktop overlap. Blocks that bleed horizontally
// (OrnateTextBox) clip themselves instead.
export const Provider: GlobalProvider = ({ children }) => (
  <VikeReactProviderPageContext pageContext={ladlePageContext}>
    <div style={{ containerType: 'inline-size' }}>
      <div style={{ '--page-width': '100cqi' } as CSSProperties}>
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </div>
  </VikeReactProviderPageContext>
)
