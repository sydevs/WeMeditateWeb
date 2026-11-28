import { describe, it, expect } from 'vitest'
import { atlasEmbedSrc } from './embed'

describe('atlasEmbedSrc', () => {
  const src = atlasEmbedSrc({ key: 'pk_test', atlasRoute: '/nl/amsterdam', routing: 'path' })
  const url = new URL(src)

  it('loads the published loader, not the widget bundle', () => {
    // `embed.js` exists, but it is what the loader fetches. Installing it
    // is the documented way to get a 404.
    expect(url.origin + url.pathname).toBe('https://sahajatlas.com/auto.js')
  })

  it('carries the key', () => {
    expect(url.searchParams.get('key')).toBe('pk_test')
  })

  it('asks for path routing, the only mode consistent with these URLs', () => {
    // Under the default `query` mode, the widget finds no `?atlas=` on
    // /map/nl/amsterdam. It opens the atlas root, replacing the content
    // just server-rendered. Head and body would then describe different places.
    expect(url.searchParams.get('routing')).toBe('path')
  })

  it('names the route to open at, as the fallback when path routing is refused', () => {
    // Path mode needs a canonical embed on the client record, which this
    // repo does not control. Without it, the widget drops to query
    // routing, and this is what still lands the visitor on the right region.
    expect(url.searchParams.get('atlas')).toBe('/nl/amsterdam')
  })

  it('percent-encodes the route rather than splicing it in raw', () => {
    expect(src).toContain('atlas=%2Fnl%2Famsterdam')
  })

  it('opens at the atlas root for /map itself', () => {
    expect(
      new URL(atlasEmbedSrc({ key: 'k', atlasRoute: '/', routing: 'path' })).searchParams.get(
        'atlas',
      ),
    ).toBe('/')
  })

  // `/map`'s URL is the one every later caller must leave alone: it is what the
  // client record's canonical embed is registered against.
  it("leaves /map's own URL byte for byte", () => {
    expect(atlasEmbedSrc({ key: 'pk_test', atlasRoute: '/nl/amsterdam', routing: 'path' })).toBe(
      'https://sahajatlas.com/auto.js?key=pk_test&routing=path&atlas=%2Fnl%2Famsterdam',
    )
  })

  describe('a class-directory block on a content page', () => {
    it('sends neither routing nor atlas when it opens at nothing', () => {
      // `query` is the widget's own default, so saying it would only add a
      // byte; a block with no `opensAt` names no route to default to.
      expect(atlasEmbedSrc({ key: 'k' })).toBe('https://sahajatlas.com/auto.js?key=k')
    })

    it('names the route an `opensAt` region or class resolves to', () => {
      expect(
        new URL(atlasEmbedSrc({ key: 'k', atlasRoute: '/london' })).searchParams.get('atlas'),
      ).toBe('/london')
      expect(
        new URL(atlasEmbedSrc({ key: 'k', atlasRoute: '/london' })).searchParams.get('routing'),
      ).toBeNull()
    })

    it('emits map=false only when the map is off', () => {
      expect(new URL(atlasEmbedSrc({ key: 'k', map: true })).searchParams.get('map')).toBeNull()
      expect(new URL(atlasEmbedSrc({ key: 'k', map: false })).searchParams.get('map')).toBe('false')
    })

    it('carries one language code, and `format` only when asked', () => {
      const directory = new URL(atlasEmbedSrc({ key: 'k', langs: 'pt', format: 'online' }))

      expect(directory.searchParams.get('langs')).toBe('pt')
      expect(directory.searchParams.get('format')).toBe('online')
      expect(
        new URL(atlasEmbedSrc({ key: 'k', langs: 'pt' })).searchParams.get('format'),
      ).toBeNull()
    })
  })
})

describe('atlasEmbedSrc with a native-letter route', () => {
  it.each([
    ['/bg/софия', '/bg/%D1%81%D0%BE%D1%84%D0%B8%D1%8F'],
    ['/de/trier/universität-trier/1998', '/de/trier/universit%C3%A4t-trier/1998'],
  ])('carries %s as one decoded value, encoded once in the query', (route, encodedPath) => {
    const src = atlasEmbedSrc({ key: 'pk_test', atlasRoute: route })

    expect(new URL(src).searchParams.get('atlas')).toBe(route)
    // The slashes encode too, so the raw query shows the percent-encoded path once.
    expect(src).toContain(`atlas=${encodeURIComponent(route)}`)
    expect(src).not.toContain('%25')
    expect(decodeURIComponent(encodeURIComponent(encodedPath))).toBe(encodedPath)
  })
})
