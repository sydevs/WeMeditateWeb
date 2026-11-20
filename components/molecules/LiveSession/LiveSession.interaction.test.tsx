// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { render } from '@testing-library/react'
import { LiveSession } from './LiveSession'
import type { SessionSchedule } from '../../../lib/live-session'

const T0 = Date.parse('2026-10-20T12:00:00.000Z')
const MINUTE = 60_000
const HOUR = 60 * MINUTE

/** Ninety seconds to the next session, and another a week later. */
const SOON: SessionSchedule = {
  starts: [new Date(T0 + 90_000).toISOString(), new Date(T0 + 7 * 24 * HOUR).toISOString()],
  timeZone: 'Europe/London',
  endTime: null,
  joinUrl: 'https://example.invalid/room',
}

/** jsdom ships no `matchMedia`, and the panel reads one for the motion preference. */
function stubMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduced })),
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

describe('LiveSession, in a browser', () => {
  it('hydrates the server markup instead of replacing it', async () => {
    stubMotion(false)

    const container = document.createElement('div')

    container.innerHTML = renderToString(<LiveSession schedule={SOON} />)
    document.body.append(container)

    // The server renders the class's own zone, which is the markup the browser
    // must agree with before the visitor's clock replaces it.
    expect(container.textContent).toContain('British Summer Time')

    const recoverable = vi.fn()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await act(async () => {
      hydrateRoot(container, <LiveSession schedule={SOON} />, {
        onRecoverableError: recoverable,
      })
    })

    expect(recoverable).not.toHaveBeenCalled()
    expect(errors).not.toHaveBeenCalled()
  })

  it('re-picks from the instants, so it goes live and then rolls on by itself', async () => {
    stubMotion(false)

    const { container } = render(<LiveSession schedule={SOON} />)

    expect(container.textContent).toContain('01Minutes')

    await act(async () => {
      vi.advanceTimersByTime(90_000)
    })
    expect(container.textContent).toContain('Happening now')

    // No `endTime`, so the session is an hour long and the next one is a week out.
    await act(async () => {
      vi.advanceTimersByTime(HOUR)
    })
    expect(container.textContent).toContain('Next session')
    expect(container.textContent).toContain('06Days')
  })

  it('redraws every second inside the final hour', async () => {
    stubMotion(false)

    const { container } = render(<LiveSession schedule={SOON} />)

    expect(container.textContent).toContain('30Seconds')

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(container.textContent).toContain('29Seconds')
  })

  it('redraws once a minute for a visitor who asked for less motion', async () => {
    stubMotion(true)

    const { container } = render(<LiveSession schedule={SOON} />)

    expect(container.textContent).toContain('01Minutes')

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(container.textContent).toContain('01Minutes')

    await act(async () => {
      vi.advanceTimersByTime(59_000)
    })
    expect(container.textContent).toContain('00Minutes')
  })

  it('stops the timer once the class has nothing left', async () => {
    stubMotion(false)

    const { container } = render(
      <LiveSession schedule={{ ...SOON, starts: ['2020-01-01T00:00:00.000Z'] }} />,
    )

    expect(container.textContent).toContain('No upcoming session')
    expect(vi.getTimerCount()).toBe(0)
  })
})
