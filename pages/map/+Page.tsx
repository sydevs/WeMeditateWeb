import { useData } from 'vike-react/useData'
import type { MapPageData } from './+data'
import { AtlasContent } from './_components/AtlasContent'
import { useAtlasHead } from '../../lib/atlas-head'
import { atlasEmbedSrc } from '../../lib/atlas-embed'

/**
 * An atlas page: `/map`, `/map/:region-path`, or `/map/:region-path/:eventId`.
 *
 * The architecture in one component. **The server owns the `<head>`** — via
 * `useAtlasHead`, from the endpoint's SEO document — and **the children own the
 * body**: the content is rendered inside `<sahaj-atlas>`, which the loader
 * adopts and React's own `createRoot` then replaces when the widget mounts.
 *
 * So the same URL serves both audiences from one document: a crawler, a social
 * scraper or a no-JS visitor reads real HTML, and a visitor with JavaScript gets
 * the interactive atlas in its place. The widget is built never to write to a
 * host's head, which is what makes the split safe rather than a race.
 */
export function Page() {
  const { seo, atlasRoute } = useData<MapPageData>()

  // A hook, so called unconditionally; it contributes nothing when `seo` is null
  // (the atlas landing page, or a document we couldn't read).
  useAtlasHead(seo)

  const embedKey = import.meta.env.PUBLIC__SAHAJ_ATLAS_KEY

  return (
    <>
      <sahaj-atlas>{seo && <AtlasContent seo={seo} />}</sahaj-atlas>

      {/* `type="module"` is required — the loader is an ES module — and
          `async`/`defer` are omitted per its documented contract. Note the
          module type already nulls `document.currentScript`, so the loader
          finds its own tag by filename either way; omitting them costs nothing
          and keeps us on the supported path. Without a key the page is still a
          complete, indexable document — it just doesn't upgrade. */}
      {embedKey && <script src={atlasEmbedSrc({ key: embedKey, atlasRoute })} type="module" />}
    </>
  )
}
