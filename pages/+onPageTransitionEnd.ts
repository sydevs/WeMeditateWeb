import { PageContext } from 'vike/types'

import { announceRouteChange } from '../lib/route-announcer'

export async function onPageTransitionEnd(pageContext: PageContext) {
  // Runs after the new page has rendered and Vike has set `document.title`,
  // which is what the announcer reads.
  announceRouteChange(document, { isBackwardNavigation: pageContext.isBackwardNavigation })
}
