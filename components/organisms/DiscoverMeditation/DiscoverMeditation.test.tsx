/**
 * The three action items are the only hard-coded site links in the tree, so
 * nothing upstream corrects them when a page is renamed. All three pointed at
 * the old Rails site's slugs, which this site answers with a 404 (#280).
 */

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { anchorFor } from '../../../tests/_helpers/markup'
import { DiscoverMeditation } from './DiscoverMeditation'

describe('DiscoverMeditation', () => {
  it.each(['/meditate-now', '/live-meditations', '/classes-near-me'])(
    'links to %s, a page this site serves',
    (href) => {
      expect(anchorFor(renderToStaticMarkup(<DiscoverMeditation />), href)).toContain('<a')
    },
  )
})
