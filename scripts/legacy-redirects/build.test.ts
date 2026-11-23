import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { LAUNCH_LOCALES, lookupIn } from '../../lib/legacy-redirects/core'
import {
  buildRedirectMap,
  withPendingSlugMoves,
  type Inventory,
  type LegacyRoutes,
  type NewSite,
} from './build'
import { stringifyMap } from './json'
import { renderCoverage } from './report'

const read = (path: string): string =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const inventory = JSON.parse(read('data/legacy-redirects/legacy-inventory.json')) as Inventory
const legacy = JSON.parse(read('data/legacy-redirects/legacy-routes.json')) as LegacyRoutes
const site = withPendingSlugMoves(
  JSON.parse(read('data/legacy-redirects/new-site.json')) as NewSite,
)
const result = buildRedirectMap(inventory, legacy, site)

describe('legacy redirect map', () => {
  it('is what the committed snapshots generate', () => {
    expect(read('lib/legacy-redirects/map.generated.json')).toBe(stringifyMap(result.map))
    expect(read('data/legacy-redirects/COVERAGE.md')).toBe(renderCoverage(result, inventory, site))
  })

  it('stays small enough to import into the Worker', () => {
    expect(Buffer.byteLength(read('lib/legacy-redirects/map.generated.json'))).toBeLessThan(
      300 * 1024,
    )
  })

  it('has no conflicting address and no self-check violation', () => {
    expect(result.conflicts).toEqual([])
    expect(result.violations).toEqual([])
  })

  it('redirects every address the generator enumerated to its expected target', () => {
    expect(result.urls.length).toBeGreaterThan(1000)

    for (const url of result.urls) {
      expect(lookupIn(result.map, encodeURI(url.path)), url.path).toBe(url.target)
    }
  })

  it('only ever targets a page published where it points, or a meditation that exists', () => {
    const pages = new Map(site.pages.map((page) => [page.slug, new Set(page.translated)]))
    const meditations = new Set(site.meditations.map((m) => m.id))
    const launch = new Set<string>(Object.values(LAUNCH_LOCALES))
    let checked = 0

    for (const url of result.urls) {
      if (!url.target || url.target === '/sitemap.xml' || url.target === '/map') continue

      const meditation = url.target.match(/^\/meditations\/(\d+)$/)

      if (meditation) {
        expect(meditations.has(Number(meditation[1])), url.target).toBe(true)
        continue
      }

      const [, locale, slug] =
        url.target.match(/^(?:\/([a-z]{2}(?:-[A-Z]{2})?))?(?:\/([^/]*))?$/) ?? []
      const language = locale && launch.has(locale) ? locale : 'en'

      // `/fr` is the home page of fr; `/` is the home page.
      const published = pages.get(locale && !slug ? '' : (slug ?? ''))

      expect(published, url.target).toBeDefined()
      expect(published!.has(language), `${url.target} in ${language}`).toBe(true)
      checked++
    }

    expect(checked).toBeGreaterThan(500)
  })

  it('never targets an address it redirects itself, or the address requested', () => {
    for (const url of result.urls) {
      if (!url.target) continue

      expect(url.target).not.toBe(url.path)
      expect(lookupIn(result.map, url.target), url.target).toBeNull()
    }
  })

  it('covers the fixed routes the cutover names', () => {
    const target = (path: string) => lookupIn(result.map, path)

    expect(target('/app')).toBe('/')
    expect(target('/classes')).toBe('/classes-near-me')
    expect(target('/live')).toBe('/live-meditations')
    expect(target('/music')).toBe('/music-for-meditation')
    expect(target('/privacy')).toBe('/privacy-notice')
    expect(target('/contact')).toBe('/contact-us')
  })

  it('refuses a pending slug move the snapshot no longer agrees with', () => {
    const moved = withPendingSlugMoves(site).pages.find((page) => page.id === 10)

    expect(moved?.slug).toBe('meditations')
    expect(() =>
      withPendingSlugMoves({
        ...site,
        pages: site.pages.map((page) => (page.id === 10 ? { ...page, slug: 'renamed' } : page)),
      }),
    ).toThrow(/pending slug move 10/)
  })

  it('leaves an old address the new site now serves itself alone', () => {
    expect(lookupIn(result.map, '/meditations')).toBeNull()
    expect(result.urls.find((url) => url.path === '/meditations')).toMatchObject({
      target: null,
      class: 'live',
    })
  })
})
