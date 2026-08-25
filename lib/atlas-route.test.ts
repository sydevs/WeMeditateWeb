/**
 * These cases are mirrored from SahajCloud's own `tests/unit/atlas-seo-route.spec.ts`.
 *
 * That is the point of the file: `parseAtlasRoute` here is a port, and a port
 * that drifts is worse than no port — the page's canonical would describe a
 * different document than its body. Keeping the two tables identical means a
 * divergence shows up as a failing test rather than as a wrong canonical in
 * production. When the upstream rule changes, change both tables together.
 */

import { describe, it, expect } from 'vitest'
import { parseAtlasRoute, matchMapRoute, MAX_ATLAS_ROUTE_LENGTH } from './atlas-route'

describe('parseAtlasRoute', () => {
  describe('region routes', () => {
    it.each([
      ['/gb', 'gb'],
      ['/gb/london', 'london'],
      ['/belgium/flanders/antwerp/downtown-hall', 'downtown-hall'],
      // Extra and trailing slashes are the caller's formatting, not structure.
      ['/gb/london/', 'london'],
      ['//gb//london', 'london'],
      ['gb/london', 'london'],
    ])('resolves %s to the region slug %s', (route, slug) => {
      expect(parseAtlasRoute(route)).toEqual({ kind: 'region', slug })
    })

    it('keys on the terminal slug alone, whatever ancestry precedes it', () => {
      expect(parseAtlasRoute('/wrong/legacy/chain/london')).toEqual({
        kind: 'region',
        slug: 'london',
      })
    })

    it('decodes percent-encoded segments, because an address bar stores them encoded', () => {
      expect(parseAtlasRoute('/be/li%C3%A8ge')).toEqual({ kind: 'region', slug: 'liège' })
    })

    it('leaves a malformed escape alone rather than throwing', () => {
      expect(parseAtlasRoute('/gb/100%')).toEqual({ kind: 'region', slug: '100%' })
    })
  })

  describe('event routes', () => {
    it('reads an all-digits terminal segment as an event id', () => {
      expect(parseAtlasRoute('/gb/london/1204')).toEqual({ kind: 'event', id: 1204 })
    })

    it('resolves an event by id alone — the region prefix is ancestry only', () => {
      expect(parseAtlasRoute('/507')).toEqual({ kind: 'event', id: 507 })
      expect(parseAtlasRoute('/some/wrong/chain/507')).toEqual({ kind: 'event', id: 507 })
    })

    it('refuses an id that no `int4` column could hold', () => {
      expect(parseAtlasRoute('/99999999999')).toBeNull()
      expect(parseAtlasRoute('/0')).toBeNull()
    })
  })

  describe('view and legacy segments', () => {
    it.each([
      ['/gb/london/1204/register', { kind: 'event', id: 1204 }],
      ['/gb/london/1204/share', { kind: 'event', id: 1204 }],
      ['/gb/london/online', { kind: 'region', slug: 'london' }],
      ['/gb/london/calendar', { kind: 'region', slug: 'london' }],
      // Case-insensitive, matching the widget's own lowercased comparison.
      ['/gb/london/REGISTER', { kind: 'region', slug: 'london' }],
    ])('drops the view segment in %s', (route, expected) => {
      expect(parseAtlasRoute(route)).toEqual(expected)
    })

    it.each([
      ['/events/507', { kind: 'event', id: 507 }],
      ['/regions/gb/london', { kind: 'region', slug: 'london' }],
      ['/areas/gb', { kind: 'region', slug: 'gb' }],
      ['/venues/gb/london', { kind: 'region', slug: 'london' }],
    ])('drops the legacy Atlas prefix in %s', (route, expected) => {
      expect(parseAtlasRoute(route)).toEqual(expected)
    })
  })

  describe('routes that name nothing', () => {
    it.each([
      ['the atlas root', '/'],
      ['an empty string', ''],
      ['a bare search view', '/search'],
      ['a bare filters view', '/filters'],
      ['nothing but legacy prefixes', '/events/areas'],
    ])('returns null for %s', (_label, route) => {
      // Not a failure: we own our own landing page's metadata, and there is no
      // document upstream to describe it with.
      expect(parseAtlasRoute(route)).toBeNull()
    })

    it.each([
      ['a query string spliced in', '/gb/london?utm_source=x'],
      ['a fragment', '/gb/london#!/x'],
      ['whitespace', '/gb/lon don'],
    ])('refuses %s rather than guessing which half was meant', (_label, route) => {
      expect(parseAtlasRoute(route)).toBeNull()
    })

    it('refuses a route past the length ceiling', () => {
      const long = `/${'a'.repeat(MAX_ATLAS_ROUTE_LENGTH)}`
      expect(long.length).toBeGreaterThan(MAX_ATLAS_ROUTE_LENGTH)
      expect(parseAtlasRoute(long)).toBeNull()
    })

    it('refuses a route with more segments than any real one has', () => {
      expect(parseAtlasRoute(`/${Array.from({ length: 12 }, (_, i) => `s${i}`).join('/')}`)).toEqual(
        { kind: 'region', slug: 's11' },
      )
      expect(
        parseAtlasRoute(`/${Array.from({ length: 13 }, (_, i) => `s${i}`).join('/')}`),
      ).toBeNull()
    })
  })
})

describe('matchMapRoute', () => {
  it.each([
    ['/map', '/'],
    ['/map/', '/'],
    ['/map/nl/amsterdam', '/nl/amsterdam'],
    ['/map/nl/amsterdam/', '/nl/amsterdam'],
    ['/map/nl/amsterdam/1204', '/nl/amsterdam/1204'],
    ['/map/search', '/search'],
    // onBeforeRoute normally strips the locale, but the matcher stands alone.
    ['/fr/map/nl/amsterdam', '/nl/amsterdam'],
    ['/fr/map', '/'],
  ])('matches %s to the atlas route %s', (pathname, atlasRoute) => {
    expect(matchMapRoute(pathname)).toEqual({ routeParams: { atlasRoute } })
  })

  it.each([
    ['the homepage', '/'],
    ['another page', '/about'],
    // ⚠ The trap the ticket flags: a page whose slug merely starts with "map"
    // is a Pages document, not the atlas.
    ['a page whose slug starts with map', '/maps'],
    ['a nested non-atlas route', '/meditations/142'],
  ])('does not match %s', (_label, pathname) => {
    expect(matchMapRoute(pathname)).toBe(false)
  })
})
