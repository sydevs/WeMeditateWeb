/**
 * Which attributes reach which element: the linked mark is an `<a>` and takes
 * every anchor attribute, the unlinked one is a `<div>` and takes none of them.
 */

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { anchorFor, openTag } from '../../../../tests/_helpers/markup'
import { Logo } from './Logo'

const ANCHOR_ONLY = {
  download: 'logo.svg',
  hrefLang: 'fr',
  media: 'print',
  ping: 'https://example.com/ping',
  referrerPolicy: 'no-referrer',
  rel: 'author',
  target: '_blank',
  type: 'image/svg+xml',
} as const

describe('Logo attributes', () => {
  it('gives the unlinked mark the shared attributes and none of the anchor ones', () => {
    const div = openTag(
      renderToStaticMarkup(<Logo aria-label="Home" id="mark" variant="icon" {...ANCHOR_ONLY} />),
      'div',
    )

    expect(div).toContain('id="mark"')
    expect(div).toContain('aria-label="Home"')
    for (const value of Object.values(ANCHOR_ONLY)) {
      expect(div).not.toContain(`"${value}"`)
    }
  })

  it('gives the linked mark the anchor attributes as well', () => {
    const anchor = anchorFor(
      renderToStaticMarkup(
        <Logo aria-label="Home" href="/about" id="mark" variant="icon" {...ANCHOR_ONLY} />,
      ),
      '/about',
    )

    expect(anchor).toContain('id="mark"')
    expect(anchor).toContain('hrefLang="fr"')
    expect(anchor).toContain('media="print"')
    expect(anchor).toContain('rel="author"')
    expect(anchor).toContain('download="logo.svg"')
  })
})
