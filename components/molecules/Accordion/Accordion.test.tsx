// @vitest-environment jsdom
import { StrictMode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axeViolations } from '../../../tests/_helpers/axe'
import { Accordion, type AccordionItemData } from './Accordion'

const items: AccordionItemData[] = [
  { id: 'cost', title: 'How much does it cost?', content: 'Nothing at all.' },
  {
    id: 'bring',
    title: 'What do I bring?',
    content: (
      <p>
        Nothing. <a href="/classes">Find a class</a>.
      </p>
    ),
  },
]

const header = (name: string) => screen.getByRole('button', { name })

/** The panel a header says it controls. */
function panelOf(button: HTMLElement): HTMLElement {
  const panel = document.getElementById(button.getAttribute('aria-controls') ?? '')

  if (!panel) throw new Error('the header controls no rendered panel')

  return panel
}

describe('Accordion', () => {
  it('names each open panel by its own header', () => {
    render(<Accordion defaultOpenItems={['cost']} items={items} />)

    // The panel's `aria-labelledby` once pointed at an id nothing rendered.
    expect(screen.getByRole('region', { name: 'How much does it cost?' })).toBe(
      panelOf(header('How much does it cost?')),
    )
  })

  it('draws no landmark of its own around the items', async () => {
    // Two on one page made two unnamed regions: axe `landmark-unique`.
    render(
      <>
        <Accordion defaultOpenItems={['cost']} items={items} />
        <Accordion items={items.map((item) => ({ ...item, id: `second-${item.id}` }))} />
      </>,
    )

    expect(screen.getAllByRole('region')).toHaveLength(1)
    expect(await axeViolations()).toEqual([])
  })

  it('keeps a closed panel out of the accessibility tree and the tab order', () => {
    render(<Accordion items={items} />)

    const button = header('What do I bring?')

    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(panelOf(button).hidden).toBe(true)
    expect(screen.queryByRole('link')).toBeNull()

    fireEvent.click(button)

    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(panelOf(button).hidden).toBe(false)
    expect(screen.getByRole('link', { name: 'Find a class' })).toBeTruthy()
  })

  it('never clips an open panel to a fixed height', () => {
    render(<Accordion defaultOpenItems={['cost']} items={items} />)

    const classes = panelOf(header('How much does it cost?')).className.split(' ')

    expect(classes.length).toBeGreaterThan(0)
    expect(classes.filter((name) => name.startsWith('max-h-'))).toEqual([])
  })

  it('closes the open item when another opens, unless several may be open', () => {
    const { unmount } = render(<Accordion defaultOpenItems={['cost']} items={items} />)

    fireEvent.click(header('What do I bring?'))

    expect(header('How much does it cost?').getAttribute('aria-expanded')).toBe('false')
    expect(header('What do I bring?').getAttribute('aria-expanded')).toBe('true')

    unmount()
    render(<Accordion allowMultiple defaultOpenItems={['cost']} items={items} />)
    fireEvent.click(header('What do I bring?'))

    expect(header('How much does it cost?').getAttribute('aria-expanded')).toBe('true')
    expect(header('What do I bring?').getAttribute('aria-expanded')).toBe('true')
  })

  it('closes only the item clicked, whatever else opened by default', () => {
    render(<Accordion defaultOpenItems={['cost', 'bring']} items={items} />)

    fireEvent.click(header('How much does it cost?'))

    expect(header('How much does it cost?').getAttribute('aria-expanded')).toBe('false')
    expect(header('What do I bring?').getAttribute('aria-expanded')).toBe('true')
  })

  it('reports each toggle once, even where React runs an updater twice', () => {
    const onToggle = vi.fn()

    render(
      <StrictMode>
        <Accordion items={items} onToggle={onToggle} />
      </StrictMode>,
    )

    fireEvent.click(header('How much does it cost?'))
    fireEvent.click(header('How much does it cost?'))

    expect(onToggle.mock.calls).toEqual([
      ['cost', true],
      ['cost', false],
    ])
  })

  it('takes its heading level from the caller, and defaults to h3', () => {
    const { unmount } = render(<Accordion items={items} />)

    expect(header('How much does it cost?').parentElement?.tagName).toBe('H3')

    unmount()
    render(<Accordion headingLevel="h2" items={items} />)

    expect(header('How much does it cost?').parentElement?.tagName).toBe('H2')
  })
})
