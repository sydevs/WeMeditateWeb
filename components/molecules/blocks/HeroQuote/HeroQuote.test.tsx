import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HeroQuote } from './HeroQuote'

describe('<HeroQuote> line breaks', () => {
  it('renders a one-line quote as the one <p> it always has', () => {
    const html = renderToStaticMarkup(<HeroQuote text="This Kundalini is the spiritual mother." />)

    expect(html).toContain(
      '<div class="text-xl sm:text-2xl leading-relaxed mb-4"><p>This Kundalini is the spiritual mother.</p></div>',
    )
  })

  it('renders each line of the textarea as its own <p>, spaced like the legacy site', () => {
    // The shape SahajCloud stores the poem on /i-meditate-to-regenerate in.
    const html = renderToStaticMarkup(
      <HeroQuote
        text={'I’m consumed with delight\r\nFeeling that glorious shade penetrate,\r\n'}
      />,
    )

    expect(html).toContain(
      '<p>I’m consumed with delight</p><p class="mt-3">Feeling that glorious shade penetrate,</p>',
    )
  })
})
