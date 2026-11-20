/**
 * Every same-origin `/api/*` route, one file each at the path it serves:
 * `/api/live-preview/populate` is `live-preview/populate.ts`, and a `:param`
 * segment adds nothing. `index.test.ts` holds the tree and this list to each
 * other.
 *
 * These routes run inside the `contextStorage()` middleware (registered
 * first in entry.ts), so `getSahajCloudContext()` resolves the API key
 * normally.
 */

import type { Hono } from 'hono'
import type { SahajCloudEnv } from '../../sahajcloud-context'
import { registerLivePreviewPopulate } from './live-preview/populate'
import { registerRelatedLectures } from './related-lectures'
import { registerRelatedMeditations } from './related-meditations'
import { registerSubmissions } from './submissions'

export function registerApiRoutes(app: Hono<SahajCloudEnv>): void {
  registerLivePreviewPopulate(app)
  registerSubmissions(app)
  registerRelatedMeditations(app)
  registerRelatedLectures(app)
}
