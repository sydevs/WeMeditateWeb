import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { registerRobots } from './route'

function get(path: string, origin = 'https://wemeditate.com') {
  const app = new Hono<SahajCloudEnv>()

  registerRobots(app)

  return app.request(`${origin}${path}`)
}

describe('/robots.txt', () => {
  it('serves plain text that allows the real site and names the sitemap', async () => {
    const response = await get('/robots.txt')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/plain')
    await expect(response.text()).resolves.toContain('Sitemap: https://wemeditate.com/sitemap.xml')
  })

  it('refuses crawlers on a preview deployment', async () => {
    const response = await get('/robots.txt', 'https://wemeditate-web-pr-62.workers.dev')

    await expect(response.text()).resolves.toContain('Disallow: /')
  })
})
