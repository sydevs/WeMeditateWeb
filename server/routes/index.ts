/**
 * Every route the Worker answers ahead of Vike, one folder each at the path it
 * serves: `/api/live-preview/populate` is `api/live-preview/populate/route.ts`,
 * `/robots.txt` is `robots.txt/route.ts`, and a `:param` segment adds no
 * folder. A route's test and anything only it reads sit beside it; a `_` file
 * is shared by the routes around it. `tests/guards/route-files.test.ts` holds
 * the tree and this list to each other.
 *
 * These routes run inside the `contextStorage()` middleware (registered
 * first in entry.ts), so `getSahajCloudContext()` resolves the API key
 * normally, and before Vike's handler, so they win over the page catch-all.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { registerLivePreviewPopulate } from './api/live-preview/populate/route'
import { registerRelatedLectures } from './api/related-lectures/route'
import { registerRelatedMeditations } from './api/related-meditations/route'
import { registerSubmissions } from './api/submissions/route'
import { registerManifest } from './manifest.webmanifest/route'
import { registerOEmbed } from './oembed/route'
import { registerRobots } from './robots.txt/route'
import { registerSitemap } from './sitemap.xml/route'

export function registerRoutes(app: Hono<SahajCloudEnv>): void {
  registerLivePreviewPopulate(app)
  registerSubmissions(app)
  registerRelatedMeditations(app)
  registerRelatedLectures(app)
  registerRobots(app)
  registerSitemap(app)
  registerManifest(app)
  registerOEmbed(app)
}
