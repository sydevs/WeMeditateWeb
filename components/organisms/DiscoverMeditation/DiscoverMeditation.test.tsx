/**
 * The three action items are the only hard-coded site links in the tree, so
 * nothing upstream corrects them when a page is renamed — each one has to be
 * a path this site serves (#280).
 */

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DiscoverMeditation } from './DiscoverMeditation'

const html = renderToStaticMarkup(<DiscoverMeditation />)

describe('DiscoverMeditation', () => {
  it.each(['/meditate-now', '/live-meditations', '/classes-near-me'])(
    'links to %s, a page this site serves',
    (href) => {
      expect(html).toContain(`href="${href}"`)
    },
  )
})
