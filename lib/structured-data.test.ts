import { describe, it, expect } from 'vitest'
import { isoDuration, serializeJsonLd } from './structured-data'

describe('isoDuration', () => {
  it.each([
    [1200, 'PT20M'],
    [45, 'PT45S'],
    [3661, 'PT1H1M1S'],
    [3600, 'PT1H'],
  ])('renders %i seconds as %s', (seconds, expected) => {
    expect(isoDuration(seconds)).toBe(expected)
  })

  it.each([0, -5, Number.NaN])('answers null for %p, so the field is dropped', (seconds) => {
    expect(isoDuration(seconds)).toBeNull()
  })
})

describe('serializeJsonLd', () => {
  it('wraps every node in one @graph under one @context', () => {
    const json = serializeJsonLd([{ '@type': 'WebSite', name: 'S', url: 'https://x.test' }])

    expect(JSON.parse(json)).toEqual({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'WebSite', name: 'S', url: 'https://x.test' }],
    })
  })

  it('answers the empty string for no nodes, which suppresses the tag', () => {
    expect(serializeJsonLd([])).toBe('')
  })

  it('escapes < so SahajCloud text cannot close the script block', () => {
    const json = serializeJsonLd([{ '@type': 'WebPage', name: '</script><b>' }])

    expect(json).not.toContain('</script>')
    expect(json).toContain('\\u003c/script')
    // The escape round-trips: a parser reads the original text back.
    expect(JSON.parse(json)['@graph'][0].name).toBe('</script><b>')
  })
})
