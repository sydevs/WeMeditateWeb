// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

const chunk = vi.hoisted(() => {
  let arrive = () => {}
  const arrived = new Promise<void>((resolve) => {
    arrive = resolve
  })

  return { arrive: () => arrive(), arrived }
})

// The hydrated branch: what `ClientOnly` renders once the page is in the
// browser, which is where the lazy chunk starts to load.
vi.mock('vike-react/ClientOnly', () => ({
  ClientOnly: ({ children }: { children: ReactNode }) => children,
}))

// The implementation's chunk, held in flight until the test lets it land.
vi.mock('./LocationSearch', async () => {
  await chunk.arrived

  return { LocationSearch: () => <input aria-label="search" /> }
})

const { LocationSearch } = await import('.')

describe('<LocationSearch> barrel', () => {
  it('keeps the fallback up while the search’s chunk loads, then swaps it out', async () => {
    render(<LocationSearch fallback={<p>Find a class</p>} onLocationSelect={() => {}} />)

    expect(screen.getByText('Find a class')).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()

    await act(async () => {
      chunk.arrive()
      await chunk.arrived
    })

    expect(await screen.findByRole('textbox', { name: 'search' })).toBeTruthy()
    expect(screen.queryByText('Find a class')).toBeNull()
  })
})
