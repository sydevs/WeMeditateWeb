// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { render } from '@testing-library/react'
import { Countdown } from './Countdown'

const T0 = Date.parse('2026-10-20T12:00:00.000Z')

/** jsdom ships no `matchMedia`, and the atom reads one for the motion preference. */
function stubMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(T0)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Countdown, in a browser', () => {
  it('hydrates the server markup instead of replacing it', async () => {
    stubMotion(false)

    const props = {
      initialRemainingMs: 90_000,
      targetDate: new Date(T0 + 90_000),
    }
    const container = document.createElement('div')

    container.innerHTML = renderToString(<Countdown {...props} />)
    document.body.append(container)

    const recoverable = vi.fn()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await act(async () => {
      hydrateRoot(container, <Countdown {...props} />, { onRecoverableError: recoverable })
    })

    expect(recoverable).not.toHaveBeenCalled()
    expect(errors).not.toHaveBeenCalled()
  })

  it('redraws once a minute for a visitor who asked for less motion', async () => {
    stubMotion(true)

    const { container } = render(
      <Countdown initialRemainingMs={90_000} targetDate={new Date(T0 + 90_000)} />,
    )

    expect(container.textContent).toContain('01Minutes')

    // A second later nothing has moved: the next tick is a minute away.
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(container.textContent).toContain('01Minutes')

    await act(async () => {
      vi.advanceTimersByTime(59_000)
    })
    expect(container.textContent).toContain('00Minutes')
  })

  it('redraws every second inside the final hour', async () => {
    stubMotion(false)

    const { container } = render(
      <Countdown initialRemainingMs={90_000} targetDate={new Date(T0 + 90_000)} />,
    )

    expect(container.textContent).toContain('30Seconds')

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    // 89 seconds left: one minute and twenty-nine.
    expect(container.textContent).toContain('29Seconds')
  })
})
