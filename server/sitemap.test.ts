import { describe, it, expect } from 'vitest'
import { buildRobotsTxt, buildSitemapXml, isCanonicalOrigin, xmlEscape } from './sitemap'

describe('xmlEscape', () => {
  it('escapes all five predefined entities', () => {
    expect(xmlEscape(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;')
  })

  it('escapes the ampersand first, so an entity is not double-escaped', () => {
    expect(xmlEscape('a&lt;b')).toBe('a&amp;lt;b')
  })
})

describe('isCanonicalOrigin', () => {
  it.each(['https://wemeditate.com', 'https://www.wemeditate.com'])(
    'allows the real site (%s)',
    (origin) => {
      expect(isCanonicalOrigin(origin)).toBe(true)
    },
  )

  it.each([
    ['a preview Worker', 'https://wemeditate-web-pr-62.workers.dev'],
    ['a preview Pages site', 'https://wemeditate-ladle.pages.dev'],
    ['local development', 'http://localhost:5173'],
    ['the IPv6 loopback, brackets and all', 'http://[::1]:5173'],
    ['a dev server bound to every interface', 'http://0.0.0.0:5173'],
    ['a dev server opened over the LAN', 'http://192.168.1.14:5173'],
    ['the same on a 10/8 network', 'http://10.0.4.7:5173'],
    ['the same on a 172.16/12 network', 'http://172.20.3.9:5173'],
  ])('refuses %s', (_label, origin) => {
    // Every PR builds these. A preview that invites crawlers competes with
    // production for the same content.
    expect(isCanonicalOrigin(origin)).toBe(false)
  })

  it('reads the host, so a port does not make a local origin the real site', () => {
    expect(isCanonicalOrigin('http://127.0.0.1:4173')).toBe(false)
  })

  it('refuses the private ranges only, so a neighbouring address still counts', () => {
    // 172.16 through 172.31 are private. 172.15 is not.
    expect(isCanonicalOrigin('https://172.15.4.4')).toBe(true)
    expect(isCanonicalOrigin('https://10.wemeditate.com')).toBe(true)
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
    // Unescaped, this yields a document no parser accepts. It fails
    // silently, as an empty sitemap, instead of loudly.
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

  describe('hreflang alternates', () => {
    it('declares the xhtml namespace, even with no alternates to carry', () => {
      // An `xhtml:link` under an undeclared prefix makes the whole document
      // invalid, and Search Console then rejects every URL in it. Declaring
      // it unconditionally removes the ordering hazard.
      const xml = buildSitemapXml([{ loc: 'https://a.test/1' }])

      expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    })

    it('emits one xhtml:link per alternate, inside the url entry', () => {
      const xml = buildSitemapXml([
        {
          loc: 'https://a.test/about',
          alternates: [
            { hreflang: 'en', href: 'https://a.test/about' },
            { hreflang: 'fr', href: 'https://a.test/fr/about' },
            { hreflang: 'x-default', href: 'https://a.test/about' },
          ],
        },
      ])

      expect(xml).toContain(
        '<url><loc>https://a.test/about</loc><xhtml:link rel="alternate" hreflang="en" href="https://a.test/about"/><xhtml:link rel="alternate" hreflang="fr" href="https://a.test/fr/about"/><xhtml:link rel="alternate" hreflang="x-default" href="https://a.test/about"/></url>',
      )
    })

    it('keeps an entry with no alternates exactly as it was', () => {
      expect(buildSitemapXml([{ loc: 'https://a.test/1', alternates: [] }])).toContain(
        '<url><loc>https://a.test/1</loc></url>',
      )
    })

    it('escapes an alternate href, so one bad URL cannot invalidate the file', () => {
      const xml = buildSitemapXml([
        {
          loc: 'https://a.test/x',
          alternates: [{ hreflang: 'fr', href: 'https://a.test/fr/x?a=1&b=2' }],
        },
      ])

      expect(xml).toContain('href="https://a.test/fr/x?a=1&amp;b=2"')
    })

    it('keeps loc and lastmod contiguous, with the alternates after them', () => {
      // The sitemaps namespace declares `<url>` as a sequence. Keeping its
      // own elements together, and the foreign-namespace children after
      // them, is what a validator that skips extensions expects.
      const xml = buildSitemapXml([
        {
          loc: 'https://a.test/x',
          lastmod: '2026-08-25T10:00:00.000Z',
          alternates: [{ hreflang: 'en', href: 'https://a.test/x' }],
        },
      ])

      expect(xml.indexOf('<lastmod>')).toBeLessThan(xml.indexOf('<xhtml:link'))
    })
  })
})
