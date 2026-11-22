/**
 * `GET /robots.txt`.
 *
 * It reads nothing, so it cannot fail: some crawlers read a 500 here as
 * "crawl nothing".
 */

import type { Hono } from 'hono'
import { ROOT_FILE_CACHE_CONTROL } from '@/server/cache-headers'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { buildRobotsTxt } from './robots'

export function registerRobots(app: Hono<SahajCloudEnv>): void {
  app.get('/robots.txt', (c) => {
    const origin = new URL(c.req.url).origin

    c.header('Content-Type', 'text/plain; charset=utf-8')
    c.header('Cache-Control', ROOT_FILE_CACHE_CONTROL)

    return c.body(buildRobotsTxt(origin))
  })
}
