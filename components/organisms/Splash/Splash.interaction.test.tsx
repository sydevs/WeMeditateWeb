// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
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

describe('<Splash loader> before React hydrates', () => {
  const lead = (
    <Splash loader priority backgroundImage="/splash-bg.jpg" ctaHref="/map" ctaText="Begin" />
  )
  let container: HTMLDivElement
  let root: Root | undefined

  /**
   * The server's HTML, with its inline script run the way the parser runs it.
   * Markup set through `innerHTML` never executes a script, so it is re-added.
   */
  const serveLead = () => {
    container = document.createElement('div')
    container.innerHTML = renderToString(lead)
    document.body.append(container)

    const served = container.querySelector('script')
    const parsed = document.createElement('script')

    parsed.textContent = served?.textContent ?? ''
    document.body.append(parsed)

    return {
      hero: container.querySelector('.group\\/splash > img') as HTMLImageElement,
      overlay: container.querySelector('.animate-splash-loader-exit') as HTMLElement,
    }
  }

  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
  })

  it('ends the moment the hero loads, without waiting for hydration', () => {
    const { hero, overlay } = serveLead()

    expect(overlay.style.opacity).toBe('')

    hero.dispatchEvent(new Event('load'))

    expect(overlay.style.opacity).toBe('0')
  })

  it('ends when the hero fails too', () => {
    const { hero, overlay } = serveLead()

    hero.dispatchEvent(new Event('error'))

    expect(overlay.style.opacity).toBe('0')
  })

  it('never shows over a hero that was already there when the script ran', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)

    try {
      expect(serveLead().overlay.style.opacity).toBe('0')
    } finally {
      complete.mockRestore()
    }
  })

  it('hydrates over what the script did without a mismatch, and React then removes it', async () => {
    vi.useFakeTimers()
    const { hero, overlay } = serveLead()

    hero.dispatchEvent(new Event('load'))

    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    const consoleError = vi.spyOn(console, 'error')

    try {
      await act(async () => {
        root = hydrateRoot(container, lead)
      })

      expect(consoleError).not.toHaveBeenCalled()
      expect(overlay.className.split(' ')).toContain('opacity-0')

      act(() => {
        vi.advanceTimersByTime(FADE_MS)
      })

      expect(container.querySelector('.animate-splash-loader-exit')).toBeNull()
    } finally {
      complete.mockRestore()
      consoleError.mockRestore()
    }
  })
})
