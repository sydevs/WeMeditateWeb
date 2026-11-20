import { describe, it, expect } from 'vitest'
import { buildOEmbedResponse, positiveInteger, resolveOEmbedTarget } from '.'

const ORIGIN = 'https://wemeditate.com'

describe('resolveOEmbedTarget', () => {
  it.each([
    [
      'a meditation',
      `${ORIGIN}/meditations/142`,
      { collection: 'meditations', id: '142', locale: 'en' },
    ],
    ['a lecture', `${ORIGIN}/lectures/163`, { collection: 'lectures', id: '163', locale: 'en' }],
    [
      'a locale-prefixed media URL, whose locale the player keeps',
      `${ORIGIN}/fr/lectures/163`,
      { collection: 'lectures', id: '163', locale: 'fr' },
    ],
  ])('resolves %s', (_label, url, expected) => {
    expect(resolveOEmbedTarget(url, ORIGIN)).toEqual(expected)
  })

  it('refuses a media path on somebody else’s host', () => {
    // The parameter is whatever a caller sends. Answering for another origin's
    // page would let anyone publish our player as theirs.
    expect(resolveOEmbedTarget('https://evil.test/meditations/142', ORIGIN)).toBeNull()
  })

  it.each([
    ['a page', `${ORIGIN}/kundalini`],
    ['the home page', `${ORIGIN}/`],
    ['an embed route, which is the player itself', `${ORIGIN}/meditations/142/embed`],
    ['the sitemap', `${ORIGIN}/sitemap.xml`],
    // A prefix SahajCloud does not define is a path segment, not a locale, so
    // this endpoint refuses it exactly as the page routes do (#315).
    ['a media path under a prefix that is not a language', `${ORIGIN}/zz/lectures/163`],
    ['something that is not a URL', 'meditations/142'],
  ])('refuses %s', (_label, url) => {
    expect(resolveOEmbedTarget(url, ORIGIN)).toBeNull()
  })
})

describe('buildOEmbedResponse', () => {
  const build = (overrides: Partial<Parameters<typeof buildOEmbedResponse>[0]> = {}) =>
    buildOEmbedResponse({
      playerUrl: `${ORIGIN}/lectures/163/embed`,
      siteName: 'We Meditate',
      siteUrl: ORIGIN,
      title: 'Interview with Shri Mataji',
      thumbnailUrl: 'https://img.test/poster.jpg',
      maxWidth: null,
      maxHeight: null,
      ...overrides,
    })

  it('answers the oEmbed video shape, with the player as its html', () => {
    const response = build()

    expect(response.version).toBe('1.0')
    expect(response.type).toBe('video')
    expect(response.provider_name).toBe('We Meditate')
    expect(response.width).toBe(560)
    expect(response.height).toBe(315)
    expect(response.html).toContain(`src="${ORIGIN}/lectures/163/embed"`)
    expect(response.html).toContain('allowfullscreen')
  })

  it('honours maxwidth, and keeps the ratio while it does', () => {
    const response = build({ maxWidth: 280 })

    expect([response.width, response.height]).toEqual([280, 158])
    expect(response.html).toContain('width="280"')
    expect(response.html).toContain('height="158"')
  })

  it('takes whichever constraint binds harder', () => {
    expect(build({ maxWidth: 1120, maxHeight: 158 }).height).toBe(158)
  })

  it('never scales the player up past its own size', () => {
    expect(build({ maxWidth: 2000, maxHeight: 2000 }).width).toBe(560)
  })

  it('omits a title and a thumbnail the read did not return', () => {
    const response = build({ title: null, thumbnailUrl: null })

    expect(response).not.toHaveProperty('title')
    expect(response).not.toHaveProperty('thumbnail_url')
  })
})

describe('positiveInteger', () => {
  it.each([
    ['560', 560],
    ['0', null],
    ['-20', null],
    ['12.5', null],
    ['abc', null],
    [undefined, null],
  ])('reads %s as %s', (raw, expected) => {
    expect(positiveInteger(raw)).toBe(expected)
  })
})
