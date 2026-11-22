/**
 * The middleware over the committed map, so a target here is one the map
 * really holds. `scripts/legacy-redirects/build.test.ts` checks the map
 * itself; this checks that a refused request reaches it.
 */

import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { registerLegacyRedirects } from './legacy-redirects'
import type { SahajCloudEnv } from './sahajcloud/context'

/** The app with a catch-all that answers the way Vike's does. */
function appServing(...served: string[]): Hono<SahajCloudEnv> {
  const app = new Hono<SahajCloudEnv>()

  registerLegacyRedirects(app)
  app.all('*', (c) =>
    served.includes(new URL(c.req.url).pathname) ? c.text('ok') : c.text('not found', 404),
  )

  return app
}

const ORIGIN = 'https://wemeditate.com'

const request = async (app: Hono<SahajCloudEnv>, path: string): Promise<Response> =>
  app.request(`${ORIGIN}${path}`)

describe('legacy redirects', () => {
  it('301s a refused request the old site answered', async () => {
    const response = await request(appServing(), '/privacy')

    expect(response.status).toBe(301)
    // Absolute, as every other redirect on this site is. `tests/smoke/web`
    // reads a `Location` with `new URL`, which a bare path throws on.
    expect(response.headers.get('location')).toBe(`${ORIGIN}/privacy-notice`)
  })

  it('keeps the query string, which is the visitor the lookup never sees', async () => {
    const response = await request(appServing(), '/classes?ref=newsletter')

    expect(response.headers.get('location')).toBe(`${ORIGIN}/classes-near-me?ref=newsletter`)
  })

  it('reaches the target in one hop from under the `/en` prefix', async () => {
    const response = await request(appServing(), '/en/privacy')

    // Not `/privacy`, which is what `+onBeforeRoute` alone would answer.
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe(`${ORIGIN}/privacy-notice`)
  })

  it('leaves a request this site serves alone', async () => {
    const response = await request(appServing('/privacy'), '/privacy')

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('leaves a 404 the old site never had as a 404', async () => {
    const response = await request(appServing(), '/not-an-address-either-site-had')

    expect(response.status).toBe(404)
  })
})
