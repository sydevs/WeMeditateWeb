import type { PageContextServer } from 'vike/types'
import type { WebConfig } from '../../../../server/sahajcloud-types'
import { loadSiteContext } from '../../../../server/site-context'
import { loadLecture, type LectureData } from '../_lecture'
import { lectureSeo } from '../../../../lib/content-seo'
import type { SeoDocument } from '../../../../lib/head'
import { normalizeContentPath } from '../../../../lib/urls'

export interface LecturePageData extends LectureData {
  settings: WebConfig
  /**
   * Everything the `<head>` publishes for this URL. The embed route builds
   * none: an iframe target is not a URL to point a crawler at.
   */
  seo: SeoDocument
}

/**
 * Fetch the lecture (shared with the embed route) plus the WebConfig that
 * LayoutChrome needs to render the nav, in parallel.
 *
 * This does not fetch related meditations here. The ranking endpoint is
 * slow (~12s), so blocking SSR on it trips Vike's slow-hook warning. The
 * full route renders the related section client-side instead
 * (RelatedContentLoader, through the template's showRelated flag).
 */
export async function data(pageContext: PageContextServer): Promise<LecturePageData> {
  const [base, site] = await Promise.all([loadLecture(pageContext), loadSiteContext(pageContext)])

  return {
    ...base,
    settings: site.settings,
    seo: lectureSeo({
      lecture: base.lecture,
      route: {
        origin: pageContext.urlParsed.origin,
        path: normalizeContentPath(pageContext.urlPathname),
        locale: base.locale,
        t: site.t,
      },
    }),
  }
}
