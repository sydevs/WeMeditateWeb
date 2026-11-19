// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileMenu } from './MobileMenu'
import type { NavItem } from '../Header'

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

const open = (props: Partial<React.ComponentProps<typeof MobileMenu>> = {}) => {
  const { container } = render(<MobileMenu navItems={navItems} {...props} />)
  const trigger = screen.getByRole('button', { name: 'Menu' })

  // A tap or a keypress focuses the button before it activates, and
  // `fireEvent.click` alone does not — which would leave the focus-return
  // assertion below measuring the document body against itself.
  trigger.focus()
  fireEvent.click(trigger)

  return { trigger, container }
}

describe('MobileMenu · opening and closing', () => {
  it('opens a dialog carrying every destination the lg: row reaches', () => {
    const { trigger } = open()

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeTruthy()

    const rows = () =>
      screen.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])

    // The panel's own bar repeats the header's logo first.
    expect(rows()).toEqual([
      ['We meditate', '/'],
      ['Meditate Now', '/meditate'],
      ['Music', '/music'],
    ])

    // The mega-menu item carries a `dropdown` payload instead of an `href`, so
    // it discloses its links rather than being a destination itself.
    fireEvent.click(screen.getByRole('button', { name: 'About Meditation' }))

    expect(rows().slice(3)).toEqual([
      ['History of Meditation', '/history-of-meditation'],
      ['Inner Energy', '/inner-energy'],
    ])
  })

  it('discloses the mega-menu item under one heading, not two', () => {
    open()
    const disclosure = screen.getByRole('button', { name: 'About Meditation' })
    const list = document.getElementById(disclosure.getAttribute('aria-controls') ?? '')

    expect(disclosure.getAttribute('aria-expanded')).toBe('false')
    expect(list?.hidden).toBe(true)

    fireEvent.click(disclosure)

    expect(disclosure.getAttribute('aria-expanded')).toBe('true')
    expect(list?.hidden).toBe(false)
    expect(screen.queryByRole('heading', { name: 'About Meditation' })).toBeNull()
  })

  it('marks the current page', () => {
    render(<MobileMenu navItems={[{ label: 'Meditate Now', href: '/meditate', active: true }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))

    expect(screen.getByRole('link', { name: 'Meditate Now' }).getAttribute('aria-current')).toBe(
      'page',
    )
  })

  it('paints above the sticky nav and the splash overlay', () => {
    // At `z-index: auto` the nav's `z-50` and the splash wrapper's `z-30`
    // painted over the panel, and a tap on × reached the bar's map pin.
    open()

    expect(screen.getByRole('dialog').closest('.z-60')).toBeTruthy()
  })

  it('offers the action link, and closes when it is taken', () => {
    open({ actionLinkHref: '/classes', actionLinkText: 'Classes near me' })

    const link = screen.getByRole('link', { name: 'Classes near me' })

    expect(link.getAttribute('href')).toBe('/classes')

    fireEvent.click(link)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('lists each language in its own name, linking to this page in it', () => {
    open({
      currentLanguage: 'en',
      languages: [
        { code: 'en', label: 'English', href: '/chakras' },
        { code: 'es', label: 'Español', href: '/chakras' },
      ],
    })

    // `footer.languages` in lib/translations.en.json.
    fireEvent.click(screen.getByRole('button', { name: 'Languages' }))

    const spanish = screen.getByRole('link', { name: 'Español' })
    const english = screen.getByRole('link', { name: 'English' })

    expect(spanish.getAttribute('href')).toBe('/es/chakras')
    expect(spanish.querySelector('[lang="es"]')).toBeTruthy()
    expect(english.getAttribute('aria-current')).toBe('true')
    expect(spanish.getAttribute('aria-current')).toBeNull()
  })

  it('offers no language list to a site with one language', () => {
    open({ languages: [{ code: 'en', label: 'English', href: '/' }] })

    expect(screen.queryByRole('button', { name: 'Languages' })).toBeNull()
  })

  it('links the social profiles', () => {
    open({ socialLinks: [{ platform: 'instagram', href: 'https://instagram.com/wemeditate' }] })

    expect(screen.getByRole('link', { name: /Instagram/ }).getAttribute('href')).toBe(
      'https://instagram.com/wemeditate',
    )
  })

  it('takes the page behind it out of reach while it is open', () => {
    const { trigger } = open()

    // The trap is what keeps Tab inside the panel, and jsdom implements no Tab
    // key — so this asserts the other half of the same mechanism: Floating UI
    // marks everything outside the portal inert and hidden from assistive tech.
    expect(trigger.closest('[aria-hidden="true"]')).toBeTruthy()
  })

  it('closes on Escape and gives focus back to the trigger', async () => {
    const { trigger } = open()

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

  it('leaves the bar entirely, so no overflow ancestor can clip it', () => {
    // `/map` renders the bar inside `overflow-hidden h-dvh`, and a splash route
    // wraps the header in `pointer-events-none`. A portaled, fixed panel is
    // outside both — which is why nothing above the nav had to change (#204).
    const { container } = open()
    const panel = screen.getByRole('dialog')

    expect(container.contains(panel)).toBe(false)
    expect(panel.className).toContain('fixed')
  })

  it('measures nothing on the bar, so it takes the whole viewport', () => {
    // An anchored top reads the `sticky` nav's viewport position, and the
    // scroll lock puts `position: fixed` on `<body>` on iOS — which drags that
    // nav off the top of the screen, panel edge behind it. #204's mechanism,
    // on the one platform this panel exists for, and jsdom takes the other
    // branch of that lock, so only this assertion stands between.
    open()
    const panel = screen.getByRole('dialog')

    expect(panel.className).toContain('inset-0')
    expect(panel.style.top).toBe('')
  })

  it('closes when a destination is taken', () => {
    open()

    // Vike swaps the page under a header that stays mounted, so a panel that
    // did not close here would cover the page it just navigated to — and
    // `markOthers` has that page hidden from assistive tech meanwhile.
    fireEvent.click(screen.getByRole('link', { name: 'Meditate Now' }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('draws the close control a covered trigger leaves it owing', () => {
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('holds the page still while it is open', () => {
    // A `fixed` panel leaves the page behind it scrollable, so the panel's own
    // scroll would chain into it.
    const before = document.body.style.overflow

    open()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).toBe(before)
  })

  it('closes on a press outside it', () => {
    open()

    fireEvent.pointerDown(document.body)
    fireEvent.mouseDown(document.body)

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
