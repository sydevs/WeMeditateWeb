/** Page component for default locale (English) pages. */

import { useData } from 'vike-react/useData'
import { PageData } from './+data'
import { Container } from '../../components/atoms'
import { SocialShare } from '../../components/molecules'
import { DiscoverMeditation } from '../../components/organisms'
import { PageTemplate } from '../../components/templates'
import { getLeadSplash } from '../../lib/content-blocks'
import { isFeaturedNavPage } from '../../lib/featured-nav'
import { LivePreviewDocument } from '../../lib/live-preview/document'
import { useLivePreviewState } from '../../lib/live-preview/session'

export function Page() {
  const { page: initialPage, settings, seo, slug } = useData<PageData>()
  // `/` routes as `index`, and it is the only URL that serves the configured
  // home page: any other spelling of that page's own slug 302s there
  // (`+data.ts`).
  const isHome = slug === 'index'
  // The canonical `+data.ts` built for the head, so a share cannot name a
  // different URL. It rides `data` to the browser, where `urlParsed` carries
  // no origin to rebuild one from.
  //
  // ⚠ That document is built under an open live preview too, where
  // `seoHeadHtml` publishes no head at all. A draft's URL 404s publicly, so it
  // is not one to hand a sharer either.
  const shareUrl = useLivePreviewState().active ? null : seo.canonical

  // Off-preview this renders `initialPage` and mounts nothing at all; under an
  // open session it renders the admin's unsaved edits. See
  // `lib/live-preview/document.tsx`.
  return (
    <LivePreviewDocument initialData={initialPage} slug="pages">
      {(page) => {
        // Drop the top padding when the page leads with a splash. This lets the
        // full-bleed hero sit flush at the top, under the overlaid header (see
        // LayoutChrome).
        const leadSplash = getLeadSplash(page.content)

        return (
          <>
            {/* Horizontal gutters now come from the Container inside
                PageTemplate/RichText, so no px here (avoids over-narrowing content). */}
            <div className={`min-h-screen ${leadSplash ? 'pb-12' : 'py-12'}`}>
              {/* On featured nav pages the highlighted nav link already names the
                  page, so suppress the redundant PageTitle banner. */}
              <PageTemplate hideTitle={isFeaturedNavPage(page, settings)} page={page} />

              {shareUrl && !isHome ? (
                <Container className="mt-12" maxWidth="md">
                  <SocialShare title={page.title} url={shareUrl} />
                </Container>
              ) : null}
            </div>

            {/* After the padded column, whose bottom padding would otherwise
                open a second gap between the section and the footer. */}
            {isHome ? (
              <DiscoverMeditation className="full-bleed" pages={settings.classPages} />
            ) : null}
          </>
        )
      }}
    </LivePreviewDocument>
  )
}
