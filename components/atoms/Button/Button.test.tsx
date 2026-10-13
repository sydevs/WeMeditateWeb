import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { StarIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'neutral'] as const

describe('Button isActive (current-page nav state)', () => {
  it('marks an active link with aria-current="page" and a persistent ghost fill', () => {
    const html = renderToStaticMarkup(
      <Button isActive href="/about" variant="ghost">
        About
      </Button>,
    )

    // aria-current signals the current page to assistive tech.
    expect(html).toContain('aria-current="page"')
    // The ghost fill (::after) is shown permanently rather than on hover.
    expect(html).toContain('after:scale-x-100')
    expect(html).toContain('after:opacity-100')
    // The fill is the surface's tint, so it reads on light and dark alike.
    expect(html).toContain('after:bg-tint')
    // The hover-only hidden state is not emitted when active.
    expect(html).not.toContain('after:scale-x-0')
  })

  it('emits aria-current on the plain button (non-link) form too', () => {
    const html = renderToStaticMarkup(
      <Button isActive variant="ghost">
        About
      </Button>,
    )

    expect(html).toContain('<button')
    expect(html).toContain('aria-current="page"')
  })

  it('does not mark inactive buttons and keeps the hover-triggered fill', () => {
    const html = renderToStaticMarkup(
      <Button href="/about" variant="ghost">
        About
      </Button>,
    )

    expect(html).not.toContain('aria-current')
    // Inactive: fill starts hidden and scales in on hover.
    expect(html).toContain('after:scale-x-0')
    expect(html).toContain('hover:after:scale-x-100')
  })
})

describe('Button focus indicator', () => {
  // Every per-variant ring colour this atom shipped sat under the 3:1 of WCAG
  // 2.1 SC 1.4.11 — teal-500 2.70, coral-500 2.53, gray-400 1.71 on white (#133).
  it('draws `focus-ring` and no per-variant ring colour', () => {
    for (const variant of VARIANTS) {
      const html = renderToStaticMarkup(<Button variant={variant}>Go</Button>)

      expect(html).toMatch(/class="[^"]*\bfocus-ring\b/)
      expect(html).not.toMatch(/\bring-/)
      expect(html).not.toContain('focus:outline-none')
    }
  })
})

describe('Button surface', () => {
  // A Button never claims a surface: it sits on one. Claiming one would also
  // recolour its own outer ring, which has to match the page around it.
  it('never sets a surface, in either form', () => {
    for (const variant of VARIANTS) {
      expect(renderToStaticMarkup(<Button variant={variant}>Go</Button>)).not.toContain('surface-')
      expect(
        renderToStaticMarkup(
          <Button href="/about" variant={variant}>
            Go
          </Button>,
        ),
      ).not.toContain('surface-')
    }
  })

  // These are the variants a surface recolours, so a scale step here would
  // pin them to one surface.
  it('colours outline and ghost from surface tokens only', () => {
    for (const variant of ['outline', 'ghost'] as const) {
      for (const html of [
        renderToStaticMarkup(<Button variant={variant}>Go</Button>),
        renderToStaticMarkup(<Button aria-label="Go" icon={StarIcon} variant={variant} />),
      ]) {
        expect(html).not.toMatch(/\b(text|border|bg)-(white|gray|teal|coral)\b/)
        expect(html).toContain('text-fg-muted')
      }
    }
  })

  // The spinner sits on the button's own fill, not on the surface around it,
  // so it takes the button's text colour.
  it('draws its loading spinner in the button text colour', () => {
    const html = renderToStaticMarkup(
      <Button isLoading variant="primary">
        Go
      </Button>,
    )

    expect(html).toContain('border-current')
  })
})
