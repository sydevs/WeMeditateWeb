// @vitest-environment jsdom
/**
 * A drawing chunk that fails to load — a dropped connection, or a hashed file
 * a deploy removed — costs the picture, not the page around it.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { VikeReactProviderPageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'
import { SubtleSystem, type SubtleSystemItem } from './SubtleSystem'

vi.mock('./SubtleSystemChart', () => {
  throw new Error('Failed to fetch dynamically imported module')
})

const items: SubtleSystemItem[] = [
  { id: 'chakra_1', title: 'Mooladhara', description: 'Innocence', linkHref: '/mooladhara' },
  { id: 'channel_left', title: 'Left Channel', description: 'Desire', linkHref: '/left' },
]

const pageContext = { isClientSide: true, locale: 'en', urlPathname: '/' } as PageContext

describe('<SubtleSystem> when the drawing fails to load', () => {
  it('keeps every preview, and the drawing’s box', async () => {
    // React reports the caught error on the console; it is the signal it landed.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { container } = render(
      <VikeReactProviderPageContext pageContext={pageContext}>
        <SubtleSystem items={items} />
      </VikeReactProviderPageContext>,
    )

    await waitFor(() => expect(consoleError).toHaveBeenCalled())

    for (const { linkHref } of items) {
      expect(container.querySelector(`a[href="${linkHref}"]`)).not.toBeNull()
    }
    expect(container.querySelector('.subtle-system-chart > svg')?.getAttribute('viewBox')).toBe(
      '0 0 442.49 558.05',
    )
    consoleError.mockRestore()
  })
})
