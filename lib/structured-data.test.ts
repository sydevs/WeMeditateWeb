import { describe, it, expect } from 'vitest'
import {
  articleNode,
  audioObjectNode,
  breadcrumbNode,
  isoDuration,
  itemListNode,
  organizationNode,
  serializeJsonLd,
  videoObjectNode,
  webPageNode,
  webSiteNode,
} from './structured-data'

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

describe('node builders', () => {
  it('drops every field SahajCloud did not return', () => {
    // The rule the whole module rests on: an invented date or image is a
    // false claim about the document, and worse than an absent one.
    // `toStrictEqual`, because `toEqual` passes on a key present and
    // undefined — which is the one way `compact` could fail silently.
    expect(articleNode({ headline: 'A', url: 'https://x.test/a' })).toStrictEqual({
      '@type': 'Article',
      headline: 'A',
      mainEntityOfPage: 'https://x.test/a',
    })
    expect(audioObjectNode({ name: 'M', url: 'https://x.test/m' })).toStrictEqual({
      '@type': 'AudioObject',
      name: 'M',
      url: 'https://x.test/m',
    })
    expect(videoObjectNode({ name: 'L', url: 'https://x.test/l' })).toStrictEqual({
      '@type': 'VideoObject',
      name: 'L',
      url: 'https://x.test/l',
    })
    expect(webPageNode({ name: 'P', url: 'https://x.test/p' })).toStrictEqual({
      '@type': 'WebPage',
      name: 'P',
      url: 'https://x.test/p',
    })
  })

  it('names the author as a Person', () => {
    expect(
      articleNode({ headline: 'A', url: 'https://x.test/a', authorName: 'Jo Smith' }).author,
    ).toEqual({ '@type': 'Person', name: 'Jo Smith' })
  })

  it('numbers a breadcrumb trail from one, and omits a rung with no URL', () => {
    const trail = breadcrumbNode([
      { name: 'We Meditate', url: 'https://x.test/' },
      { name: 'About Meditation' },
      { name: 'Benefits' },
    ])

    expect(trail.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'We Meditate', item: 'https://x.test/' },
      { '@type': 'ListItem', position: 2, name: 'About Meditation' },
      { '@type': 'ListItem', position: 3, name: 'Benefits' },
    ])
  })

  it('numbers a list from one', () => {
    expect(itemListNode([{ name: 'One', url: 'https://x.test/1' }]).itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'One', url: 'https://x.test/1' },
    ])
  })

  it('claims every social profile as sameAs', () => {
    expect(
      organizationNode({
        name: 'We Meditate',
        url: 'https://x.test',
        logo: 'https://x.test/logo.svg',
        sameAs: ['https://social.test/a'],
      }),
    ).toEqual({
      '@type': 'Organization',
      name: 'We Meditate',
      url: 'https://x.test',
      logo: 'https://x.test/logo.svg',
      sameAs: ['https://social.test/a'],
    })
  })
})

describe('serializeJsonLd', () => {
  it('wraps every node in one @graph under one @context', () => {
    const json = serializeJsonLd([webSiteNode({ name: 'S', url: 'https://x.test' })])

    expect(JSON.parse(json)).toEqual({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'WebSite', name: 'S', url: 'https://x.test' }],
    })
  })

  it('answers the empty string for no nodes, which suppresses the tag', () => {
    expect(serializeJsonLd([])).toBe('')
  })

  it('escapes < so SahajCloud text cannot close the script block', () => {
    const json = serializeJsonLd([webPageNode({ name: '</script><b>', url: 'https://x.test/p' })])

    expect(json).not.toContain('</script>')
    expect(json).toContain('\\u003c/script')
    // The escape round-trips: a parser reads the original text back.
    expect(JSON.parse(json)['@graph'][0].name).toBe('</script><b>')
  })
})
