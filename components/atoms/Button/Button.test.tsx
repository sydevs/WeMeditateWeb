import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Button } from './Button'
import { Link } from '../Link'

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

const focusClasses = (html: string): string[] =>
  [...html.matchAll(/focus-visible:[\w:/.-]+/g)].map((m) => m[0]).sort()

describe('Button focus indicator', () => {
  // Every light-theme ring colour this atom shipped sat under the 3:1 of WCAG
  // 2.1 SC 1.4.11 — teal-500 2.70, coral-500 2.53, gray-400 1.71 on white — and
  // `focus:outline-none` suppressed the conformant UA outline behind it (#133).
  it('rings in teal-600 on light and white on dark', () => {
    const light = renderToStaticMarkup(<Button variant="primary">Go</Button>)
    const dark = renderToStaticMarkup(
      <Button theme="dark" variant="primary">
        Go
      </Button>,
    )

    expect(light).toContain('focus-visible:ring-2')
    expect(light).toContain('focus-visible:ring-teal-600')
    expect(light).toContain('focus-visible:ring-offset-white')

    expect(dark).toContain('focus-visible:ring-2')
    expect(dark).toContain('focus-visible:ring-white')
    expect(dark).toContain('focus-visible:ring-offset-teal-900')
  })

  it('no longer suppresses the outline outside :focus-visible', () => {
    const html = renderToStaticMarkup(<Button variant="primary">Go</Button>)

    expect(html).not.toContain('focus:outline-none')
    expect(html).toContain('focus-visible:outline-none')
  })

  it('carries no per-variant ring colour', () => {
    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'neutral'] as const) {
      const html = renderToStaticMarkup(<Button variant={variant}>Go</Button>)

      expect(html).not.toContain('ring-teal-500')
      expect(html).not.toContain('ring-coral-500')
      expect(html).not.toContain('ring-gray-400')
      expect(html).not.toContain('ring-gray-500')
    }
  })

  // `Button href` renders a `<Link>`, which draws its own base ring. Left on the
  // default theme it would emit the light ring beside the dark one, and two
  // rules would race for `--tw-ring-color`.
  it('emits one ring colour in the link form, matching the theme', () => {
    const html = renderToStaticMarkup(
      <Button href="/about" theme="dark" variant="primary">
        Go
      </Button>,
    )

    expect(html).toContain('focus-visible:ring-white')
    expect(html).not.toContain('focus-visible:ring-teal-600')
    expect(html).not.toContain('focus-visible:ring-offset-white')
  })

  it('draws the same indicator as a bare <Link>', () => {
    const button = renderToStaticMarkup(<Button variant="primary">Go</Button>)
    const link = renderToStaticMarkup(<Link href="/about">About</Link>)

    expect(focusClasses(button)).toEqual(focusClasses(link))
  })
})
