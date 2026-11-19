// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axeViolations } from '../../../tests/_helpers/axe'
import { MasonryGrid, type MasonryGridItem } from './MasonryGrid'

const items: MasonryGridItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: index,
  title: `Moment ${index + 1}`,
  href: `/moments/${index + 1}`,
  text: `What happened ${index + 1}.`,
}))

describe('MasonryGrid Show More', () => {
  it('keeps the waiting items out of reach until the button reveals them', () => {
    render(<MasonryGrid items={items} />)

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Moment 1',
      'Moment 2',
      'Moment 3',
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Show More' }))

    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.queryByRole('button', { name: 'Show More' })).toBeNull()
  })

  // The button unmounts under the keyboard, so focus would fall to <body> and
  // the reader would start again from the top of the page.
  it('moves focus to the first item it reveals', () => {
    render(<MasonryGrid items={items} />)

    const button = screen.getByRole('button', { name: 'Show More' })

    button.focus()
    fireEvent.click(button)

    const revealed = screen.getByRole('link', { name: 'Moment 4' }).closest('li')

    expect(revealed).not.toBeNull()
    expect(document.activeElement).toBe(revealed)
  })

  it('names the button by its label and describes it by the count', async () => {
    render(<MasonryGrid items={items} />)

    const button = screen.getByRole('button', { name: 'Show More' })

    expect(button.getAttribute('aria-label')).toBeNull()
    expect(
      document.getElementById(button.getAttribute('aria-describedby') ?? '')?.textContent,
    ).toBe('Show 2 more items')
    expect(await axeViolations()).toEqual([])
  })
})
