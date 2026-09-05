import { PageContext } from 'vike/types'

import { announceRouteChange } from '../lib/route-announcer'

export async function onPageTransitionEnd(pageContext: PageContext) {
  // Runs after the new page renders and Vike sets `document.title`. The
  // announcer reads that title.
  announceRouteChange(document, { isBackwardNavigation: pageContext.isBackwardNavigation })
}
