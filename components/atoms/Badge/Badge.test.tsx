import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { anchorFor } from '../../../tests/_helpers/markup'
import { Badge } from './Badge'

describe('<Badge> as a link', () => {
  it('locale-prefixes a site path', () => {
    const html = renderToStaticMarkup(
      <Badge href="/meditations" locale="fr">
        New
      </Badge>,
    )

    expect(html).toContain('href="/fr/meditations"')
  })

  it('renders no href at all for a refused scheme', () => {
    const html = renderToStaticMarkup(<Badge href="javascript:alert(1)">New</Badge>)

    expect(html).toContain('New')
    expect(html).not.toContain('javascript:')
  })

  it('keeps its own colours, and takes the atom’s focus ring', () => {
    const anchor = anchorFor(
      renderToStaticMarkup(
        <Badge color="secondary" href="/meditations">
          New
        </Badge>,
      ),
      '/meditations',
    )

    expect(anchor).toContain('bg-coral-100')
    expect(anchor).toContain('focus-ring')
    // `unstyled`, so the atom paints no link colour over the badge's own.
    expect(anchor).not.toContain('text-primary')
  })

  it('stays a span when no href is given', () => {
    const html = renderToStaticMarkup(<Badge>10 min</Badge>)

    expect(html).toContain('<span')
    expect(html).not.toContain('<a')
  })
})
