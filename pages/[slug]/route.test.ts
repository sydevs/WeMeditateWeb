/**
 * Named without the `+` its subject carries: Vike loads every `+`-prefixed file
 * under `pages/` as a config file and rejects one that exports no `route` /
 * `default`, which fails the build rather than the test run. Co-located all the
 * same.
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

  // ⚠ Regression guard for the trap in #62: this matcher takes any single
  // segment, so before the exclusion `/map` resolved to the Pages renderer and
  // rendered "page not found" for a route that exists. It would not announce
  // itself — nothing errors, the wrong page just renders.
  it('leaves /map to the atlas route function', () => {
    expect(match('/map')).toBe(false)
    expect(match('/map/')).toBe(false)
  })

  it('still matches a page whose slug merely starts with "map"', () => {
    expect(match('/maps')).toEqual({ routeParams: { slug: 'maps' } })
  })
})
