/**
 * Named without the `+` its subject carries. Vike loads every `+`-prefixed
 * file under `pages/` as a config file, and rejects one that exports no
 * `route` and no `default`. That failure shows up in the build, not the
 * test run. This test still lives next to its subject.
 */
import { describe, it, expect } from 'vitest'
import route from './+route'

/** Vike calls the matcher with the (locale-normalized) pathname. */
const match = (urlPathname: string) => route({ urlPathname })

describe('the [slug] page matcher', () => {
  it.each([
    ['/about', 'about'],
    ['/contact', 'contact'],
    ['/about/', 'about'],
  ])('matches %s as the page slug %s', (pathname, slug) => {
    expect(match(pathname)).toEqual({ routeParams: { slug } })
  })

  it.each([
    ['the homepage', '/'],
    ['a locale-prefixed path', '/de/about'],
    ['a nested path', '/meditations/142'],
  ])('does not match %s', (_label, pathname) => {
    expect(match(pathname)).toBe(false)
  })

  // ⚠ Regression guard for the trap in #62. This matcher takes any single
  // segment. Before the exclusion, `/map` resolved to the Pages renderer
  // and rendered "page not found" for a route that exists. Nothing errors.
  // The wrong page just renders, with no warning.
  it('leaves /map to the atlas route function', () => {
    expect(match('/map')).toBe(false)
    expect(match('/map/')).toBe(false)
  })

  it('still matches a page whose slug merely starts with "map"', () => {
    expect(match('/maps')).toEqual({ routeParams: { slug: 'maps' } })
  })
})
