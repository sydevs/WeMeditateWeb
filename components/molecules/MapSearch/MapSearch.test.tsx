import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { anchorFor, classFor } from '../../../tests/_helpers/markup'

interface StubProps {
  fallback?: ReactNode
  label?: ReactNode
  placeholder?: string
  onLocationSelect: (place: { name: string; coordinates: { lat: number; lng: number } }) => void
}

const state = vi.hoisted(() => ({
  pageContext: undefined as { locale: string } | undefined,
  search: null as StubProps | null,
}))

vi.mock('vike-react/usePageContext', () => ({
  usePageContext: () => state.pageContext,
}))

// The Mapbox search is browser-only; the stub renders what the server sends
// in its place and keeps the props, so a test can pick a place through them.
vi.mock('../LocationSearch', () => ({
  LocationSearch: (props: StubProps) => {
    state.search = props

    return props.fallback ?? null
  },
}))

const { MapSearch } = await import('./MapSearch')

const LONDON = { name: 'London', coordinates: { lat: 51.5072, lng: -0.1276 } }

/** Picks a place the way the search would, and returns where the page went. */
function pick(place = LONDON): string | undefined {
  const assign = vi.fn()

  vi.stubGlobal('window', { location: { assign } })
  state.search!.onLocationSelect(place)

  return assign.mock.calls[0]?.[0]
}

afterEach(() => {
  vi.unstubAllGlobals()
  state.pageContext = undefined
  state.search = null
})

describe('<MapSearch> without JavaScript', () => {
  it('links to the class map in the editor’s words', () => {
    const html = renderToStaticMarkup(<MapSearch label="Find a class near you" />)

    expect(anchorFor(html, '/map')).not.toBe('')
    expect(html).toContain('Find a class near you')
  })

  it('links to the map in the visitor’s language', () => {
    state.pageContext = { locale: 'fr' }

    expect(
      anchorFor(renderToStaticMarkup(<MapSearch label="Trouver un cours" />), '/fr/map'),
    ).not.toBe('')
  })

  it('falls back to the shared wording when the editor left the field blank', () => {
    for (const html of [
      renderToStaticMarkup(<MapSearch />),
      renderToStaticMarkup(<MapSearch label="   " />),
    ]) {
      expect(anchorFor(html, '/map')).not.toBe('')
      expect(html).toContain('Classes Near Me')
    }
  })

  // Measured in Ladle: 96px before and after the search replaces the fallback
  // with a label, 50px without one, at 1280 and 375 wide.
  it('holds the search’s height, so the splash does not jump when it arrives', () => {
    const box = (label?: string) =>
      classFor(renderToStaticMarkup(<MapSearch label={label} />), 'max-w-md').split(' ')

    expect(box('Find a class near you')).toContain('min-h-24')
    expect(box()).toContain('min-h-12.5')
    expect(box('   ')).toContain('min-h-12.5')
  })
})

describe('<MapSearch> with JavaScript', () => {
  it('labels the search, visibly, in the editor’s words', () => {
    renderToStaticMarkup(<MapSearch label="Find a class near you" />)

    const label = renderToStaticMarkup(<>{state.search?.label}</>)

    expect(label).toContain('Find a class near you')
    expect(classFor(label, 'text-fg').split(' ')).toContain('text-fg')
    // Its own placeholder stays: the wording is the label, not a grey hint.
    expect(state.search?.placeholder).toBeUndefined()
  })

  it('leaves a blank field to the search’s own screen-reader name', () => {
    renderToStaticMarkup(<MapSearch label="   " />)

    expect(state.search?.label).toBeFalsy()
  })

  it('opens the class map searching around the chosen place', () => {
    renderToStaticMarkup(<MapSearch label="Find a class near you" />)

    expect(pick()).toBe('/map?atlas=%2Fsearch%3Fcenter%3D-0.1276%2C51.5072%26q%3DLondon')
  })

  it('opens it in the visitor’s language', () => {
    state.pageContext = { locale: 'fr' }
    renderToStaticMarkup(<MapSearch />)

    expect(pick()).toMatch(/^\/fr\/map\?atlas=%2Fsearch%3F/)
  })
})
