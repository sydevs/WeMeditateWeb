import type { PageContextServer } from 'vike/types'
import type { WebConfig } from '../../server/cms-types'
import type { AtlasSeoResponse } from '../../server/atlas-types'
import { getWebConfig } from '../../server/cms-client'
import { getAtlasSeo } from '../../server/atlas-client'

export interface MapPageData {
  /** The atlas route this page is of, e.g. `/nl/amsterdam` or `/` for the root. */
  atlasRoute: string
  /**
   * The server-rendered half, or `null` for the atlas landing page and for any
   * route whose document we couldn't read. Never a reason to fail the page: the
   * widget is what most visitors see, and it fetches its own data.
   */
  seo: AtlasSeoResponse | null
  settings: WebConfig
}

/**
 * Resolve the atlas route to its SEO document, alongside the WebConfig the site
 * chrome needs.
 *
 * Deliberately **not** a 404 when the document doesn't resolve. An atlas route
 * that names nothing is a normal state — the atlas root and the widget's own
 * view routes (`/search`, `/calendar`) name no document by design — and even a
 * genuinely stale region link should still land on a working atlas rather than
 * an error page, because the widget can navigate the visitor somewhere useful
 * from there. What we drop is the server-rendered content and the page-specific
 * metadata, which is the honest thing to drop: we have nothing to describe.
 */
export async function data(pageContext: PageContextServer): Promise<MapPageData> {
  const atlasRoute = pageContext.routeParams.atlasRoute ?? '/'

  const [seo, settings] = await Promise.all([
    getAtlasSeo({ route: atlasRoute, locale: pageContext.locale }),
    getWebConfig({ locale: pageContext.locale }),
  ])

  return { atlasRoute, seo, settings }
}
