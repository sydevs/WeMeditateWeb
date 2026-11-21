import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { registerRoutes } from '@/server/routes'

/**
 * server/routes/ is the route list: each route lives in the `route.ts` of the
 * folder its path names, every `route.ts` registers one, every other file
 * belongs to a route's folder or is a shared `_` file, and `index.ts`
 * registers them all. A route added anywhere else, a stray file, or a route
 * `index.ts` forgets fails here.
 */

type RouteModule = Record<string, unknown>

/** What the globs below resolve against. Stripped off each key, so a reported path reads as the folder does. */
const ROUTES_DIR = '../../server/routes/'

function inRoutesDir(file: string): string {
  return file.slice(ROUTES_DIR.length)
}

const files = Object.keys(import.meta.glob('../../server/routes/**/*.ts')).map(inRoutesDir)

const routeFiles: [string, () => Promise<RouteModule>][] = Object.entries(
  import.meta.glob<RouteModule>('../../server/routes/**/route.ts'),
).map(([file, load]) => [inRoutesDir(file), load])

/** `/api/live-preview/populate` → `api/live-preview/populate/route.ts`; a `:param` adds nothing. */
function fileFor(path: string): string {
  const segments = path
    .replace(/^\//, '')
    .split('/')
    .filter((segment) => !segment.startsWith(':'))

  return `${segments.join('/')}/route.ts`
}

/** Method and path of every handler `register` adds, middleware left out. */
function routesOf(register: (app: Hono<SahajCloudEnv>) => void): string[] {
  const app = new Hono<SahajCloudEnv>()

  register(app)

  return app.routes
    .filter((route) => route.method !== 'ALL')
    .map((route) => `${route.method} ${route.path}`)
}

async function registerOf(load: () => Promise<RouteModule>) {
  const exported = Object.entries(await load()).filter(
    ([name, value]) => name.startsWith('register') && typeof value === 'function',
  )

  expect(exported).toHaveLength(1)

  return exported[0][1] as (app: Hono<SahajCloudEnv>) => void
}

describe('server/routes', () => {
  it('has a route file to check', () => {
    expect(routeFiles.length).toBeGreaterThan(0)
  })

  it.each(routeFiles)('%s registers only the routes its folder names', async (file, load) => {
    const routes = routesOf(await registerOf(load))

    expect(routes.length).toBeGreaterThan(0)

    for (const route of routes) {
      const path = route.split(' ')[1]

      expect(fileFor(path), route).toBe(file)
    }
  })

  it('keeps every other file in a route folder, or shared under a `_` name', () => {
    const routeFolders = routeFiles.map(([file]) => file.replace(/route\.ts$/, ''))

    for (const file of files) {
      if (file === 'index.ts') continue

      if (file.split('/').at(-1)!.startsWith('_')) continue

      expect(
        routeFolders.some((folder) => file.startsWith(folder)),
        `${file} is in no route's folder`,
      ).toBe(true)
    }
  })

  it('registers every route file from index.ts, and nothing else', async () => {
    const expected: string[] = []

    for (const [, load] of routeFiles) {
      expected.push(...routesOf(await registerOf(load)))
    }

    expect(routesOf(registerRoutes).sort()).toEqual(expected.sort())
  })
})
