/**
 * Smoke specs for the class map route (`/map`), against the deployed
 * Cloudflare preview.
 *
 * The atlas itself is a client-side widget, out of reach of a fetch smoke.
 * This pins which URLs answer for it.
 */
import { describe, it, expect } from 'vitest'
import { fetchPage } from '../_helpers/preview'

describe('preview map', () => {
  it('answers at /map and not under a prefix that is not a locale', async () => {
    // The control: without it the 404s below would pass on a preview that
    // serves no map at all.
    expect((await fetchPage('/map')).status, '/map should render').toBe(200)

    // "zz" is no SahajCloud locale, so `+onBeforeRoute` leaves it on the path
    // and the map route must not take it: a 200 here is a second address of
    // the atlas.
    for (const path of ['/zz/map', '/zz/map/nl']) {
      expect((await fetchPage(path)).status, `${path} should 404`).toBe(404)
    }
  })
})
