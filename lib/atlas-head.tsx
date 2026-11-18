/**
 * `<head>` tags for an atlas page, from the SEO document the C3 endpoint serves.
 *
 * The split this whole feature rests on: the server owns the `<head>`, the
 * widget owns the body. The widget is built to never write to a host's
 * head, so these tags are the only thing a crawler or a social scraper
 * ever sees. They must be right in the server-rendered document, not
 * after hydration.
 *
 * Everything here comes from the endpoint. In particular, the canonical
 * is the document's own `webUrl`, read and never recomputed. The
 * ownership walk that produces it lives upstream, and a second
 * implementation here would be free to disagree with the first.
 * Publishing a canonical that points at a URL that does not restore the
 * view is exactly the failure canonicals exist to prevent.
 *
 * This module only adapts that answer to the shape `lib/head.tsx` renders.
 * The content routes build the same shape locally (`lib/content-seo.ts`),
 * so one component renders every head on the site.
 */

import { useConfig } from 'vike-react/useConfig'
import type { AtlasSeoResponse } from '../server/atlas-types'
import { SeoHeadTags, type SeoHead } from './head'

/**
 * Open Graph properties `useAtlasHead` already passes to `useConfig`, which
 * emits each of them. The endpoint sends them in `openGraph` as well, so
 * they are dropped here rather than rendered twice.
 */
const OG_EMITTED_BY_CONFIG: ReadonlySet<string> = new Set([
  'og:title',
  'og:description',
  'og:image',
])

/** The atlas answer as a {@link SeoHead}. */
export function atlasHead(seo: AtlasSeoResponse): SeoHead {
  return {
    canonical: seo.canonical,
    // One row per enabled atlas locale, plus x-default. The canonical is
    // locale-free by design. Nothing in the atlas is translated, so the
    // locales differ only in the widget's UI language, which the endpoint
    // carries as `?locale=` — unlike a content page's cluster, whose members
    // are path prefixes. The two clusters must not be merged, but they are
    // spelled by one component.
    alternates: seo.alternates,
    meta: Object.entries(seo.openGraph).filter(
      ([property]) => !OG_EMITTED_BY_CONFIG.has(property),
    ),
    jsonLd: seo.jsonLd,
  }
}

/** The head tags an atlas page contributes. */
export function AtlasHeadTags({ seo }: { seo: AtlasSeoResponse }) {
  return <SeoHeadTags seo={atlasHead(seo)} />
}

/**
 * Sets an atlas page's head during render.
 *
 * This is a hook, so call it unconditionally from a component. `seo` is
 * `null` only when the document could not be read — the atlas root has one
 * like every other route (#64). In that case the global defaults apply, and
 * this function contributes nothing: a guessed canonical is worse than none.
 */
export function useAtlasHead(seo: AtlasSeoResponse | null): void {
  const config = useConfig()

  if (!seo) {
    return
  }

  const image = seo.openGraph['og:image']

  config({
    title: seo.title,
    ...(seo.description ? { description: seo.description } : {}),
    ...(image ? { image } : {}),
    // ⚠ An array, even for one element. `Head` is a cumulative config,
    // and vike-react spreads it at render time
    // (`...pageContext._configViaHook?.Head ?? []` in its `getHeadHtml`).
    // A bare element throws `((intermediate value) ?? []) is not
    // iterable` and 500s the page. Its own types do not say so:
    // `ConfigViaHook` picks `Head` from `Vike.Config`, where it is
    // singular, so the compiler accepts the broken form. Verified against
    // vike-react@0.6.19.
    Head: [<AtlasHeadTags key="atlas-head" seo={seo} />],
  })
}
