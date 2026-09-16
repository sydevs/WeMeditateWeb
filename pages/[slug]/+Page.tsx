/**
 * Page component for default locale (English) pages.
 */

import { useData } from 'vike-react/useData'
import { PageData } from './+data'
import { PageTemplate } from '../../components/templates'
import { getLeadSplash } from '../../lib/cms-blocks'
import { isFeaturedNavPage } from '../../lib/featured-nav'
import { LivePreviewDocument } from '../../lib/live-preview/document'

export function Page() {
  const { page: initialPage, settings } = useData<PageData>()

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
          // Horizontal gutters now come from the Container inside
          // PageTemplate/RichText, so no px here (avoids over-narrowing content).
          <div className={`min-h-screen ${leadSplash ? 'pb-12' : 'py-12'}`}>
            {/* On featured nav pages the highlighted nav link already names the
                page, so suppress the redundant PageTitle banner. */}
            <PageTemplate hideTitle={isFeaturedNavPage(page, settings)} page={page} />
          </div>
        )
      }}
    </LivePreviewDocument>
  )
}
