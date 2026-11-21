import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Countdown } from './Countdown'
import { classesWith, classOf, openTag } from '../../../tests/_helpers/markup'

const DAY = 86_400_000
const HOUR = 3_600_000

const render = (props: Partial<Parameters<typeof Countdown>[0]> = {}) =>
  renderToStaticMarkup(<Countdown remainingMs={HOUR} {...props} />)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Countdown', () => {
  it('counts down in days once a session is more than a day away', () => {
    // Six days out used to render as `167:59:59`, because every hour past the
    // first day was piled into the hours cell.
    const html = render({ remainingMs: 6 * DAY + 23 * HOUR })

    expect(html).toContain('>06<')
    expect(html).toContain('Days')
    expect(html).toContain('>23<')
  })

  it('hides the days cell, and keeps hours 0-23, below a day', () => {
    const html = render({ remainingMs: 23 * HOUR })

    expect(html).not.toContain('Days')
    expect(html).toContain('>23<')
  })

  it('hides the ticking digits from assistive tech', () => {
    // Six numbers changing every second is nothing a screen reader can follow.
    const html = render()

    expect(classOf(html, 'Hours').split(' ')).toContain('font-number')
    expect(html).toContain('aria-hidden="true"')
    // The hidden element is the one wrapping the figures, not the panel.
    expect(classesWith(html, 'tabular-nums').length).toBeGreaterThan(0)
    expect(html.slice(0, html.indexOf('aria-hidden'))).not.toContain('Hours')
  })

  it('carries the finished sentence in one polite region, and nothing when it has none', () => {
    const announcement = 'The next session is Tuesday at 7:00 pm, in 1 hour.'
    const html = render({ announcement })

    expect(html).toContain(announcement)
    expect(classOf(html, announcement).split(' ')).toContain('sr-only')
    expect(openTag(html, 'p')).toContain('aria-live="polite"')
    expect(render()).not.toContain('aria-live')
  })

  it('reads no clock at all, so the server and the browser agree', () => {
    // The atom seeded its state from a live `Date.now()` during render, so the
    // server and the first client render disagreed and React threw the
    // server's markup away. The clock belongs to `LiveSession` now.
    const now = vi.spyOn(Date, 'now')

    expect(render()).toBe(render())
    expect(now).not.toHaveBeenCalled()
  })

  it('shows zeroes rather than negative figures once the time is up', () => {
    expect(render({ remainingMs: -5000 })).toContain('>00<')
  })
})
