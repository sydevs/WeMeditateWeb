import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SocialIcon } from './SocialIcon'

/**
 * These render bare, with no Vike app around them, so `useT` falls back to
 * `lib/translations.en.json` — the committed mirror of the SahajCloud English
 * locale, which is also what Ladle renders with.
 */
describe('<SocialIcon> new-tab announcement', () => {
  it('names the platform and the new tab', () => {
    const html = renderToStaticMarkup(
      <SocialIcon platform="facebook" href="https://facebook.com/wemeditate" />,
    )

    expect(html).toContain('aria-label="Facebook (opens in new tab)"')
    expect(html).toContain('_blank')
  })

  it('keeps the warning when the caller supplies its own label', () => {
    // `SocialShare` labels every button "Share on <platform>". The label
    // replaces the accessible name, so the announcement has to live inside
    // it — and spreading `props` over a finished one dropped it (#238).
    const html = renderToStaticMarkup(
      <SocialIcon
        platform="facebook"
        href="https://facebook.com/wemeditate"
        aria-label="Share on Facebook"
      />,
    )

    expect(html).toContain('aria-label="Share on Facebook (opens in new tab)"')
  })

  it('renders no href for a scheme that would execute in our origin', () => {
    // `layouts/Footer.tsx` feeds this prop a SahajCloud-configured URL.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const html = renderToStaticMarkup(<SocialIcon platform="facebook" href="javascript:alert(1)" />)

    expect(html).not.toContain('href')
    expect(html).not.toContain('javascript')
    expect(html).not.toContain('_blank')
    expect(html).not.toContain('opens in new tab')

    warn.mockRestore()
  })
})
