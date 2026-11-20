import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { SahajCloudEnv } from '../../sahajcloud-context'
import { registerApiRoutes } from '.'

/**
 * The folder is the route list: each route lives in the file its path names,
 * every route file registers one, and `index.ts` registers them all. A route
 * added anywhere else, or a file `index.ts` forgets, fails here.
 */

type RouteModule = Record<string, unknown>

const routeFiles = Object.entries(import.meta.glob<RouteModule>('./**/*.ts')).filter(
  ([file]) =>
    file !== './index.ts' && !file.endsWith('.test.ts') && !file.split('/').at(-1)!.startsWith('_'),
)

/** `/api/live-preview/populate` → `./live-preview/populate.ts`; a `:param` adds nothing. */
function fileFor(path: string): string {
  const segments = path
    .replace(/^\/api\//, '')
    .split('/')
    .filter((segment) => !segment.startsWith(':'))

  return `./${segments.join('/')}.ts`
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

describe('server/routes/api', () => {
  it('has a route file to check', () => {
    expect(routeFiles.length).toBeGreaterThan(0)
  })

  it.each(routeFiles)('%s registers only the routes its path names', async (file, load) => {
    const routes = routesOf(await registerOf(load))

    expect(routes.length).toBeGreaterThan(0)

    for (const route of routes) {
      const path = route.split(' ')[1]

      expect(path.startsWith('/api/'), route).toBe(true)
      expect(fileFor(path), route).toBe(file)
    }
  })

  it('registers every route file from index.ts, and nothing else', async () => {
    const expected: string[] = []

    for (const [, load] of routeFiles) {
      expected.push(...routesOf(await registerOf(load)))
    }

    expect(routesOf(registerApiRoutes).sort()).toEqual(expected.sort())
  })
})
