// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileMenu } from './MobileMenu'
import type { NavItem } from '../Header/Header'

const navItems: NavItem[] = [
  { label: 'Meditate Now', href: '/meditate' },
  { label: 'Music', href: '/music' },
  {
    label: 'About Meditation',
    dropdown: {
      title: 'About Meditation',
      links: [
        { label: 'History of Meditation', href: '/history-of-meditation' },
        { label: 'Inner Energy', href: '/inner-energy' },
      ],
      featuredArticles: [],
    },
  },
]

const open = () => {
  render(<MobileMenu navItems={navItems} />)
  const trigger = screen.getByRole('button', { name: 'Menu' })

  // A tap or a keypress focuses the button before it activates, and
  // `fireEvent.click` alone does not — which would leave the focus-return
  // assertion below measuring the document body against itself.
  trigger.focus()
  fireEvent.click(trigger)

  return trigger
}

describe('MobileMenu', () => {
  it('opens a dialog carrying every destination the lg: row reaches', () => {
    const trigger = open()

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeTruthy()

    const rows = screen
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')])

    expect(rows).toEqual([
      ['Meditate Now', '/meditate'],
      ['Music', '/music'],
      ['History of Meditation', '/history-of-meditation'],
      ['Inner Energy', '/inner-energy'],
    ])
  })

  it('takes the page behind it out of reach while it is open', () => {
    const trigger = open()

    // The trap is what keeps Tab inside the panel, and jsdom implements no Tab
    // key — so this asserts the other half of the same mechanism: Floating UI
    // marks everything outside the portal inert and hidden from assistive tech.
    expect(trigger.closest('[aria-hidden="true"]')).toBeTruthy()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(trigger.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('lists a mega-menu item inline, under its own label, and never as a link', () => {
    open()

    // The item carries a `dropdown` payload instead of an `href`, so it is a
    // heading over its links rather than a destination of its own.
    expect(screen.getByRole('heading', { name: 'About Meditation' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'About Meditation' })).toBeNull()
  })

  it('closes on Escape and gives focus back to the trigger', async () => {
    const trigger = open()

    // Focus is put on a row first, standing in for the Tab that takes a
    // keyboard user there. Without it the trigger never loses focus, and the
    // assertion below would hold for a panel that returns none.
    screen.getByRole('link', { name: 'Meditate Now' }).focus()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    // Floating UI returns focus on the next frame, which `act` does not flush.
    await new Promise(requestAnimationFrame)

    expect(document.activeElement).toBe(trigger)
  })

  it('closes on a press outside it', () => {
    open()

    fireEvent.pointerDown(document.body)
    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
