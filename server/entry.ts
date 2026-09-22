import { apply, serve } from '@photonjs/hono'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'
import type { SahajCloudEnv } from './sahajcloud-context'
import { registerApiRoutes } from './api-routes'
import { registerSitemapRoutes } from './sitemap-routes'
import { LIVE_PREVIEW_PARAM } from '../lib/live-preview/protocol'

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000

export default startServer()

function startServer() {
  const app = new Hono<SahajCloudEnv>()

  // Enable context storage for AsyncLocalStorage-based config access
  // This MUST be registered before other middleware
  app.use(contextStorage())

  // A live-preview response must never be stored or indexed.
  //
  // ⚠ **Registered before the routes.** Hono runs handlers in registration
  // order and a route handler returns without calling `next()`, so middleware
  // added after `registerApiRoutes` would never run for those paths at all.
  //
  // ⚠ **After `next()`, not before.** `registerApiRoutes` sets its own
  // `Cache-Control: public, max-age=300` inside the handler, so a header
  // written on the way in is overwritten on the way out.
  //
  // Presence of the parameter, not its validity: this runs outside the Vike
  // render and has no verdict to read, and a request carrying a bogus token
  // getting `no-store` it did not earn costs a slightly colder cache. The
  // alternative — a draft response stored because the token was malformed —
  // is not symmetrical with that.
  //
  // `Referrer-Policy` matters here in particular: without it the token would
  // ride the `Referer` of every subresource the preview page requests.
  app.use('*', async (c, next) => {
    await next()

    if (!c.req.query(LIVE_PREVIEW_PARAM)) return

    c.header('Cache-Control', 'no-store')
    c.header('X-Robots-Tag', 'noindex')
    c.header('Referrer-Policy', 'no-referrer')
  })

  // Same-origin JSON endpoints (client-loaded related content). Registered
  // before Vike's handler so they take precedence over the page catch-all.
  registerApiRoutes(app)

  // robots.txt / sitemap.xml, likewise before the page catch-all.
  registerSitemapRoutes(app)

  apply(app, [])

  return serve(app, {
    port,
  })
}
