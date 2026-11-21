/** Every same-origin `/api/*` route. `../index.ts` holds the convention. */

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
