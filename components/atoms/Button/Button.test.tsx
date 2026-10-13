import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button } from './Button'

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
    // Light theme reuses the ghost hover colour (gray-100).
    expect(html).toContain('after:bg-gray-100')
    // The hover-only hidden state is not emitted when active.
    expect(html).not.toContain('after:scale-x-0')
  })

  it('uses the dark-theme ghost tint on dark backgrounds', () => {
    const html = renderToStaticMarkup(
      <Button isActive href="/about" theme="dark" variant="ghost">
        About
      </Button>,
    )

    expect(html).toContain('aria-current="page"')
    expect(html).toContain('after:bg-white/20')
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
    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'neutral'] as const) {
      const html = renderToStaticMarkup(<Button variant={variant}>Go</Button>)

      expect(html).toMatch(/class="[^"]*\bfocus-ring\b/)
      expect(html).not.toMatch(/\bring-/)
      expect(html).not.toContain('focus:outline-none')
    }
  })

  it('inherits its surface when no theme is given, and claims one when told', () => {
    expect(renderToStaticMarkup(<Button>Go</Button>)).not.toContain('surface-')
    expect(renderToStaticMarkup(<Button theme="dark">Go</Button>)).toContain('surface-dark')
  })

  // `Button href` renders a `<Link>`, which draws its own `focus-ring`. Only
  // the Button may claim a surface, or the two could disagree.
  it('claims one surface in the link form, matching the theme', () => {
    const html = renderToStaticMarkup(
      <Button href="/about" theme="dark" variant="primary">
        Go
      </Button>,
    )

    expect(html).toContain('surface-dark')
    expect(html).not.toContain('surface-light')
  })
})
