import { describe, it, expect } from 'vitest'
import { buildRobotsTxt } from './robots'

describe('buildRobotsTxt', () => {
  it('allows crawling and names the sitemap on the real site', () => {
    const robots = buildRobotsTxt('https://wemeditate.com')

    expect(robots).toContain('Allow: /')
    // robots.txt requires an absolute sitemap URL.
    expect(robots).toContain('Sitemap: https://wemeditate.com/sitemap.xml')
  })

  it('refuses everything on a preview, and offers no sitemap to follow', () => {
    const robots = buildRobotsTxt('https://wemeditate-web-pr-62.workers.dev')

    expect(robots).toContain('Disallow: /')
    expect(robots).not.toContain('Sitemap:')
  })
})
