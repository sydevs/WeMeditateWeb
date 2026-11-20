// @vitest-environment jsdom
/**
 * The chart's keyboard path: a node that opens a preview is a named button,
 * focus shows its preview, and Enter or Space moves focus into it — the only
 * way a keyboard reaches that preview's link.
 *
 * The real `ClientOnly`, under a client-side pageContext, so the drawing
 * arrives through the same lazy module the browser loads.
 */

import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { VikeReactProviderPageContext } from 'vike-react/usePageContext'
import type { PageContext } from 'vike/types'
import { SubtleSystem, type SubtleSystemItem } from './SubtleSystem'

const items: SubtleSystemItem[] = [
  { id: 'chakra_1', title: 'Mooladhara', description: 'Innocence', linkHref: '/mooladhara' },
  { id: 'chakra_4', title: 'Anahat', description: 'Love', linkHref: '/anahat' },
  { id: 'chakra_7', title: 'Sahasrara', description: 'Integration', linkHref: '/sahasrara' },
  { id: 'channel_left', title: 'Left Channel', description: 'Desire', linkHref: '/left' },
]

const pageContext = { isClientSide: true, locale: 'en', urlPathname: '/' } as PageContext

const node = (id: string) => document.getElementById(id) as unknown as SVGElement
const panel = (id: string) => document.querySelector(`[data-node-id="${id}"]`) as HTMLElement
const link = (id: string) => panel(id).querySelector('a') as HTMLAnchorElement
const isOpen = (id: string) => !panel(id).hasAttribute('inert')

async function renderChart() {
  const onNodeSelect = vi.fn()

  render(
    <VikeReactProviderPageContext pageContext={pageContext}>
      <SubtleSystem items={items} onNodeSelect={onNodeSelect} />
    </VikeReactProviderPageContext>,
  )
  // The drawing lands a render after the first, once its module resolves.
  await waitFor(() => expect(node('chakra_1')).not.toBeNull())

  return { onNodeSelect }
}

describe('<SubtleSystem> from the keyboard', () => {
  it('makes each shown node with a preview a button named by its title', async () => {
    await renderChart()

    expect(screen.getByRole('button', { name: 'Mooladhara' })).toBe(node('chakra_1'))
    expect(node('chakra_1').getAttribute('tabindex')).toBe('0')
    expect(node('chakra_1').getAttribute('aria-controls')).toBe(panel('chakra_1').id)
    expect(node('chakra_1').getAttribute('aria-expanded')).toBe('false')
  })

  it('gives no stop to a node with no preview, or to one the view hides', async () => {
    await renderChart()

    expect(node('chakra_4').getAttribute('tabindex')).toBe('0')
    // No item: nothing to open.
    expect(node('chakra_2').hasAttribute('tabindex')).toBe(false)
    expect(node('chakra_2').hasAttribute('role')).toBe(false)
    // An item, but the chakras view hides the channels.
    expect(node('channel_left').hasAttribute('tabindex')).toBe(false)
  })

  it('shows a node’s preview on focus, and keeps every other one out of reach', async () => {
    const { onNodeSelect } = await renderChart()

    expect(items.every(({ id }) => !isOpen(id))).toBe(true)

    act(() => node('chakra_1').focus())

    expect(isOpen('chakra_1')).toBe(true)
    expect(node('chakra_1').getAttribute('aria-expanded')).toBe('true')
    expect(onNodeSelect).toHaveBeenLastCalledWith('chakra_1')

    act(() => node('chakra_4').focus())

    expect(isOpen('chakra_4')).toBe(true)
    expect(isOpen('chakra_1')).toBe(false)
    expect(node('chakra_1').getAttribute('aria-expanded')).toBe('false')
  })

  it.each([
    ['Enter', 'Enter'],
    ['Space', ' '],
  ])('moves focus onto the preview’s link on %s', async (_, key) => {
    await renderChart()
    act(() => node('chakra_1').focus())

    // `false` is a prevented default: Space must not scroll the page.
    expect(fireEvent.keyDown(node('chakra_1'), { key })).toBe(false)
    await waitFor(() => expect(document.activeElement).toBe(link('chakra_1')))
    expect(link('chakra_1').getAttribute('href')).toBe('/mooladhara')
  })

  it('reopens the focused node’s preview when the pointer has moved to another', async () => {
    const { onNodeSelect } = await renderChart()

    act(() => node('chakra_1').focus())
    fireEvent.mouseOver(node('chakra_4'))
    await waitFor(() => expect(isOpen('chakra_4')).toBe(true))
    expect(onNodeSelect).toHaveBeenLastCalledWith('chakra_4')

    fireEvent.keyDown(node('chakra_1'), { key: 'Enter' })

    await waitFor(() => expect(document.activeElement).toBe(link('chakra_1')))
    expect(isOpen('chakra_1')).toBe(true)
    expect(isOpen('chakra_4')).toBe(false)
    expect(onNodeSelect).toHaveBeenLastCalledWith('chakra_1')
  })

  it('reports the selection to a listener bound before the pointer moved it', async () => {
    const { onNodeSelect } = await renderChart()

    act(() => node('chakra_1').focus())
    // One batch: the keydown reaches the listener bound while chakra_1 was selected.
    act(() => {
      node('chakra_4').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      node('chakra_1').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      )
    })

    expect(isOpen('chakra_1')).toBe(true)
    expect(onNodeSelect).toHaveBeenLastCalledWith('chakra_1')
  })

  it('moves the stops with the view', async () => {
    await renderChart()

    fireEvent.click(screen.getByRole('button', { name: 'Channels' }))

    expect(node('channel_left').getAttribute('role')).toBe('button')
    expect(node('channel_left').getAttribute('aria-label')).toBe('Left Channel')
    expect(node('chakra_1').hasAttribute('tabindex')).toBe(false)
    // Still drawn in the channels view, but no pointer handler reaches it there.
    expect(node('chakra_7').hasAttribute('tabindex')).toBe(false)
  })

  it('still opens a preview from the pointer', async () => {
    await renderChart()

    fireEvent.mouseOver(node('chakra_4'))
    await waitFor(() => expect(isOpen('chakra_4')).toBe(true))

    fireEvent.click(node('chakra_7'))
    expect(isOpen('chakra_7')).toBe(true)
  })
})
