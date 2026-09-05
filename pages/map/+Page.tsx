import { useData } from 'vike-react/useData'
import type { MapPageData } from './+data'
import { AtlasContent } from './_components/AtlasContent'
import { useAtlasHead } from '../../lib/atlas-head'
import { atlasEmbedSrc } from '../../lib/atlas-embed'

/**
 * An atlas page: `/map`, `/map/:region-path`, or `/map/:region-path/:eventId`.
 *
 * The architecture in one component. The server owns the `<head>`, through
 * `useAtlasHead`, from the endpoint's SEO document. The children own the
 * body: the content renders inside `<sahaj-atlas>`, which the loader
 * adopts. React's own `createRoot` then replaces the content when the
 * widget mounts.
 *
 * So the same URL serves both audiences from one document. A crawler, a
 * social scraper, or a no-JS visitor reads real HTML. A visitor with
 * JavaScript gets the interactive atlas in its place. The widget never
 * writes to a host's head, which is what makes the split safe, not a race.
 */
export function Page() {
  const { seo, atlasRoute } = useData<MapPageData>()

  // A hook, so this call is unconditional. It contributes nothing when
  // `seo` is null (the atlas landing page, or a document this app could
  // not read).
  useAtlasHead(seo)

  const embedKey = import.meta.env.PUBLIC__SAHAJ_ATLAS_KEY

  return (
    <>
      {/* `block` plus a definite height is the opt-in for the widget's
          contained map mode (SahajAtlasWeb#170). It makes the element the
          containing block for the map's fixed descendants, and a stacking
          context, so our sticky header floats above the map instead of the
          map escaping to cover the viewport. Unsized, the map fills the
          window, and our `z-50` nav paints over it.

          ⚠ Use `height`, never `min-height`. A `min-height` box has a
          non-zero rect, so containment engages. But the widget's own
          `height: 100%` then resolves against an `auto` parent as zero. It
          checks its own box, finds nothing, and renders uncontained.

          `overflow-y-auto` keeps the server-rendered content reachable
          for a no-JS visitor, when a region lists more classes than the
          box fits. Crawlers read the DOM regardless of overflow. */}
      <sahaj-atlas className="block h-full overflow-y-auto">
        {seo && <AtlasContent seo={seo} />}
      </sahaj-atlas>

      {/* `type="module"` is required, because the loader is an ES module.
          `async` and `defer` are omitted, per its documented contract. The
          module type already nulls `document.currentScript`, so the
          loader finds its own tag by filename either way. Omitting them
          costs nothing, and keeps this on the supported path. Without a
          key, the page is still a complete, indexable document. It just
          does not upgrade. */}
      {embedKey && <script src={atlasEmbedSrc({ key: embedKey, atlasRoute })} type="module" />}
    </>
  )
}
