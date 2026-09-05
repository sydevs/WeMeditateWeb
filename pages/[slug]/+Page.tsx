/**
 * Page component for default locale (English) pages.
 */

import { useData } from 'vike-react/useData'
import { PageData } from './+data'
import { PageTemplate } from '../../components/templates'
import { getLeadSplash } from '../../lib/cms-blocks'
import { isFeaturedNavPage } from '../../lib/featured-nav'

export function Page() {
  const { page, settings } = useData<PageData>()
  // Drop the top padding when the page leads with a splash. This lets the
  // full-bleed hero sit flush at the top, under the overlaid header (see
  // LayoutChrome).
  const leadSplash = getLeadSplash(page.content)
  // On featured nav pages the highlighted nav link already names the page, so
  // suppress the redundant PageTitle banner (see lib/featured-nav).
  const hideTitle = isFeaturedNavPage(page, settings)

  return (
    // Horizontal gutters now come from the Container inside
    // PageTemplate/RichText, so no px here (avoids over-narrowing content).
    <div className={`min-h-screen ${leadSplash ? 'pb-12' : 'py-12'}`}>
      <PageTemplate hideTitle={hideTitle} page={page} />
    </div>
  )
}
