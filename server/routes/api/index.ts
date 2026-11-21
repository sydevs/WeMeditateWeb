/**
 * Every same-origin `/api/*` route, one folder each at the path it serves:
 * `/api/live-preview/populate` is `live-preview/populate/route.ts`, and a
 * `:param` segment adds no folder. A route's test and anything only it reads
 * sit beside it; a top-level `_` file is shared by several routes.
 * `tests/guards/api-route-files.test.ts` holds the tree and this list to each
 * other.
 *
 * These routes run inside the `contextStorage()` middleware (registered
 * first in entry.ts), so `getSahajCloudContext()` resolves the API key
 * normally.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '../../sahajcloud-context'
import { registerLivePreviewPopulate } from './live-preview/populate/route'
import { registerRelatedLectures } from './related-lectures/route'
import { registerRelatedMeditations } from './related-meditations/route'
import { registerSubmissions } from './submissions/route'

export function registerApiRoutes(app: Hono<SahajCloudEnv>): void {
  registerLivePreviewPopulate(app)
  registerSubmissions(app)
  registerRelatedMeditations(app)
  registerRelatedLectures(app)
}
