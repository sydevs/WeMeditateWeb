import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { SahajCloudEnv } from '../../server/sahajcloud-context'

/**
 * The folder is the route list: each route lives in the `route.ts` of the
 * folder its path names, every `route.ts` registers one, every other file
 * belongs to a route's folder or is a `_` file the routes below it share, and
 * each `index.ts` registers every route below it. A route added anywhere
 * else, a stray file, or a route an `index.ts` forgets fails here.
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

const indexFiles: [string, () => Promise<RouteModule>][] = Object.entries(
  import.meta.glob<RouteModule>('../../server/routes/**/index.ts'),
).map(([file, load]) => [inRoutesDir(file), load])

/** `/api/live-preview/populate` → `api/live-preview/populate/route.ts`; a `:param` adds nothing. */
function fileFor(path: string): string {
  const segments = path
    .replace(/^\//, '')
    .split('/')
    .filter((segment) => !segment.startsWith(':'))

  return `${segments.join('/')}/route.ts`
}

/** The folder a path inside the tree sits in, `''` at the top. */
function folderOf(file: string): string {
  return file.slice(0, file.lastIndexOf('/') + 1)
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
  it('has a route file and a registration list to check', () => {
    expect(routeFiles.length).toBeGreaterThan(0)
    expect(indexFiles.length).toBeGreaterThan(0)
  })

  it.each(routeFiles)('%s registers only the routes its folder names', async (file, load) => {
    const routes = routesOf(await registerOf(load))

    expect(routes.length).toBeGreaterThan(0)

    for (const route of routes) {
      const path = route.split(' ')[1]

      expect(path.startsWith('/'), route).toBe(true)
      expect(fileFor(path), route).toBe(file)
    }
  })

  it('keeps every other file in a route folder, or shared under a `_` name', () => {
    const routeFolders = routeFiles.map(([file]) => folderOf(file))

    for (const file of files) {
      const folder = folderOf(file)
      const name = file.slice(folder.length)

      if (name === 'index.ts') continue

      // A `_` file shares what the routes below it read, so one with no route
      // below it shares nothing, wherever in the tree it sits.
      const shared = name.startsWith('_') && routeFolders.some((r) => r.startsWith(folder))

      expect(
        routeFolders.some((route) => file.startsWith(route)) || shared,
        `${file} is in no route's folder, and shares nothing`,
      ).toBe(true)
    }
  })

  it.each(indexFiles)('%s registers every route below it, and nothing else', async (file, load) => {
    const folder = folderOf(file)
    const expected: string[] = []

    for (const [routeFile, loadRoute] of routeFiles) {
      if (!routeFile.startsWith(folder)) continue

      expected.push(...routesOf(await registerOf(loadRoute)))
    }

    expect(expected.length).toBeGreaterThan(0)
    expect(routesOf(await registerOf(load)).sort()).toEqual(expected.sort())
  })
})
