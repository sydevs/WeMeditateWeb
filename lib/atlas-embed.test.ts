import { describe, it, expect } from 'vitest'
import { atlasEmbedSrc } from './atlas-embed'

describe('atlasEmbedSrc', () => {
  const src = atlasEmbedSrc({ key: 'pk_test', atlasRoute: '/nl/amsterdam' })
  const url = new URL(src)

  it('loads the published loader, not the widget bundle', () => {
    // `embed.js` exists but is what the loader fetches; installing it is the
    // documented way to get a 404.
    expect(url.origin + url.pathname).toBe('https://sahajatlas.com/auto.js')
  })

  it('carries the key', () => {
    expect(url.searchParams.get('key')).toBe('pk_test')
  })

  it('asks for path routing, the only mode consistent with these URLs', () => {
    // Under the default `query` mode the widget finds no `?atlas=` on
    // /map/nl/amsterdam and opens the atlas root, replacing the content we
    // server-rendered — head and body would then describe different places.
    expect(url.searchParams.get('routing')).toBe('path')
  })

  it('names the route to open at, as the fallback when path routing is refused', () => {
    // Path mode needs a canonical embed on the client record, which this repo
    // does not control; without it the widget drops to query routing, and this
    // is what still lands the visitor on the right region.
    expect(url.searchParams.get('atlas')).toBe('/nl/amsterdam')
  })

  it('percent-encodes the route rather than splicing it in raw', () => {
    expect(src).toContain('atlas=%2Fnl%2Famsterdam')
  })

  it('opens at the atlas root for /map itself', () => {
    expect(new URL(atlasEmbedSrc({ key: 'k', atlasRoute: '/' })).searchParams.get('atlas')).toBe('/')
  })
})
