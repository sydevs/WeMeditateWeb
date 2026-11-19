// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import { Splash } from './Splash'

/** SplashLoader unmounts this long after its fade starts. */
const FADE_MS = 500

const renderLead = () => {
  const { container } = render(
    <Splash loader priority backgroundImage="/splash-bg.jpg" ctaHref="/map" ctaText="Begin" />,
  )
  const root = container.firstElementChild as HTMLElement

  return {
    hero: root.querySelector(':scope > img') as HTMLImageElement,
    overlay: () => root.querySelector<HTMLElement>('.animate-splash-loader-exit'),
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('<Splash loader>', () => {
  it('is hidden from assistive technology and holds nothing focusable', () => {
    const { overlay } = renderLead()

    expect(overlay()?.getAttribute('aria-hidden')).toBe('true')
    expect(overlay()?.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
  })

  it('fades out once the hero image loads, then leaves the DOM', () => {
    vi.useFakeTimers()
    const { hero, overlay } = renderLead()

    expect(overlay()?.className.split(' ')).toContain('opacity-100')

    fireEvent.load(hero)

    expect(overlay()?.className.split(' ')).toContain('opacity-0')

    act(() => {
      vi.advanceTimersByTime(FADE_MS)
    })

    expect(overlay()).toBeNull()
  })

  it('ends when the hero image fails too, rather than waiting on it', () => {
    vi.useFakeTimers()
    const { hero, overlay } = renderLead()

    fireEvent.error(hero)
    act(() => {
      vi.advanceTimersByTime(FADE_MS)
    })

    expect(overlay()).toBeNull()
  })

  it('ends at once for an image that finished before React was listening', () => {
    vi.useFakeTimers()
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)

    try {
      const { overlay } = renderLead()

      expect(overlay()?.className.split(' ')).toContain('opacity-0')
    } finally {
      complete.mockRestore()
    }
  })

  it('stays while the image is still on its way', () => {
    vi.useFakeTimers()
    const { overlay } = renderLead()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    // The CSS timer, not this, ends it then: jsdom runs no animation.
    expect(overlay()?.className.split(' ')).toContain('opacity-100')
  })
})
