import { describe, it, expect } from 'vitest'
import { buildRobotsTxt, buildSitemapXml, isIndexableHost, xmlEscape } from './sitemap'

describe('xmlEscape', () => {
  it('escapes all five predefined entities', () => {
    expect(xmlEscape(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;')
  })

  it('escapes the ampersand first, so an entity is not double-escaped', () => {
    expect(xmlEscape('a&lt;b')).toBe('a&amp;lt;b')
  })
})

describe('isIndexableHost', () => {
  it.each(['wemeditate.com', 'www.wemeditate.com'])('allows the real site (%s)', (host) => {
    expect(isIndexableHost(host)).toBe(true)
  })

  it.each([
    ['a preview Worker', 'wemeditate-web-pr-62.workers.dev'],
    ['a preview Pages site', 'wemeditate-ladle.pages.dev'],
    ['local development', 'localhost'],
  ])('refuses %s', (_label, host) => {
    // Every PR builds these. A preview that invites crawlers competes with
    // production for the same content.
    expect(isIndexableHost(host)).toBe(false)
  })
})

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

describe('buildSitemapXml', () => {
  it('renders a valid, namespaced document', () => {
    const xml = buildSitemapXml([{ loc: 'https://wemeditate.com/about' }])

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(xml).toContain('<url><loc>https://wemeditate.com/about</loc></url>')
  })

  it('includes lastmod only when the source has one', () => {
    const xml = buildSitemapXml([
      { loc: 'https://a.test/1', lastmod: '2026-08-25T10:00:00.000Z' },
      { loc: 'https://a.test/2', lastmod: null },
    ])

    expect(xml).toContain('<lastmod>2026-08-25T10:00:00.000Z</lastmod>')
    expect(xml).toContain('<url><loc>https://a.test/2</loc></url>')
  })

  it('escapes a URL containing an ampersand rather than emitting broken XML', () => {
    // Unescaped, this yields a document no parser accepts — a silently empty
    // sitemap rather than a loud failure.
    const xml = buildSitemapXml([{ loc: 'https://a.test/x?a=1&b=2' }])

    expect(xml).toContain('https://a.test/x?a=1&amp;b=2')
  })

  it('collapses a URL arriving from two sources', () => {
    const xml = buildSitemapXml([{ loc: 'https://a.test/1' }, { loc: 'https://a.test/1' }])

    expect(xml.match(/<url>/g)).toHaveLength(1)
  })

  it('drops empty locs instead of emitting an empty entry', () => {
    expect(buildSitemapXml([{ loc: '' }])).not.toContain('<url>')
  })

  it('renders a well-formed empty document when there is nothing to list', () => {
    const xml = buildSitemapXml([])

    expect(xml).toContain('<urlset')
    expect(xml).toContain('</urlset>')
  })
})
