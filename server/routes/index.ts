/**
 * Every route under `server/routes/`, one folder each at the path it serves.
 * A file whose name starts with `_` is shared by the routes below it and
 * registers none. `tests/guards/route-files.test.ts` holds the tree and this
 * list to each other. `sitemap-routes.ts` is the one route still outside the
 * tree (#293).
 *
 * These routes run inside the `contextStorage()` middleware (registered
 * first in entry.ts), so `getSahajCloudContext()` resolves the API key
 * normally.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '../sahajcloud-context'
import { registerApiRoutes } from './api'
import { registerOEmbed } from './oembed/route'

export function registerRoutes(app: Hono<SahajCloudEnv>): void {
  registerApiRoutes(app)
  registerOEmbed(app)
}
