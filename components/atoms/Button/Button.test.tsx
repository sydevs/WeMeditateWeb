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

// `touch-target` and `touch-target-overlay` are the two 44x44 utilities in
// layouts/tailwind.css. These cases pin which one each form gets, at each
// size — geometry needs a browser, so it stays in Ladle and on the preview.
describe('Button touch target (44x44 minimum)', () => {
  const sizes = ['xs', 'sm', 'md', 'lg'] as const

  it.each(sizes)('clamps the %s text button', (size) => {
    const html = renderToStaticMarkup(<Button size={size}>Label</Button>)

    expect(html).toContain('touch-target')
    expect(html).not.toContain('touch-target-overlay')
  })

  it.each(sizes)('overlays the %s icon-only button, leaving its box alone', (size) => {
    const html = renderToStaticMarkup(<Button aria-label="Play" icon={PlayIcon} size={size} />)

    expect(html).toContain('touch-target-overlay')
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

    expect(text).toContain('touch-target')
    expect(text).not.toContain('touch-target-overlay')
    expect(iconOnly).toContain('touch-target-overlay')
  })

  it('applies the hit area to the link form too', () => {
    const html = renderToStaticMarkup(
      <Button aria-label="Play" href="/meditations" icon={PlayIcon} size="md" />,
    )

    expect(html).toContain('<a')
    expect(html).toContain('touch-target-overlay')
  })
})
