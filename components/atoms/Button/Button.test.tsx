import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PlayIcon } from '@heroicons/react/24/outline'
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

describe('Button touch target (44x44 minimum)', () => {
  const sizes = ['xs', 'sm', 'md', 'lg'] as const
  const drawnIconSize = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }

  it.each(sizes)('clamps the %s text button to a 44px box', (size) => {
    const html = renderToStaticMarkup(<Button size={size}>Label</Button>)

    expect(html).toContain('min-w-11')
    expect(html).toContain('min-h-11')
  })

  it.each(sizes)('gives the %s icon-only button a 44px ::before hit area', (size) => {
    const html = renderToStaticMarkup(<Button aria-label="Play" icon={PlayIcon} size={size} />)

    expect(html).toContain('before:h-11')
    expect(html).toContain('before:w-11')
    expect(html).toContain('before:-translate-x-1/2')
    expect(html).toContain('before:-translate-y-1/2')
    // An absolutely positioned ::before needs a positioned ancestor.
    expect(html).toContain('relative')
  })

  it.each(sizes)('leaves the %s icon-only button drawn at its own size', (size) => {
    const html = renderToStaticMarkup(<Button aria-label="Play" icon={PlayIcon} size={size} />)

    expect(html).toContain(drawnIconSize[size])
    expect(html).not.toContain('min-w-11')
  })

  it('keeps the hit area on a disabled button, which drops the hover fill', () => {
    const text = renderToStaticMarkup(
      <Button disabled size="xs">
        Label
      </Button>,
    )
    const iconOnly = renderToStaticMarkup(
      <Button disabled aria-label="Play" icon={PlayIcon} size="xs" />,
    )

    expect(text).toContain('min-h-11')
    expect(iconOnly).toContain('before:h-11')
  })

  it('applies the hit area to the link form too', () => {
    const html = renderToStaticMarkup(
      <Button aria-label="Play" href="/meditations" icon={PlayIcon} size="md" />,
    )

    expect(html).toContain('<a')
    expect(html).toContain('before:h-11')
  })
})
