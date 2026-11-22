import { describe, it, expect } from 'vitest'
import { documentHref, matchDocumentRoute, refId, refSlug } from './document-routes'

describe('refId', () => {
  it('returns a bare numeric id as a string', () => {
    expect(refId(42)).toBe('42')
  })

  it('returns a bare string id unchanged', () => {
    expect(refId('abc')).toBe('abc')
  })

  it('reads id from a populated object', () => {
    expect(refId({ id: 7, slug: 'about' })).toBe('7')
  })

  it('returns null for null/undefined or an object without an id', () => {
    expect(refId(null)).toBeNull()
    expect(refId(undefined)).toBeNull()
    expect(refId({ slug: 'about' })).toBeNull()
  })
})

describe('refSlug', () => {
  it('reads a non-empty slug from a populated object', () => {
    expect(refSlug({ id: 1, slug: 'about' })).toBe('about')
  })

  it('returns null for bare ids, empty slugs, and null', () => {
    expect(refSlug(5)).toBeNull()
    expect(refSlug({ id: 1, slug: '' })).toBeNull()
    expect(refSlug({ id: 1 })).toBeNull()
    expect(refSlug(null)).toBeNull()
  })
})

describe('documentHref', () => {
  it('builds a page path from a populated page with a slug', () => {
    expect(documentHref('pages', { id: 1, slug: 'about' })).toBe('/about')
  })

  it('returns null for a page reference with no slug (unpublished / bare id)', () => {
    // A published page populates into an object with a slug. An
    // unpublished one returns as a bare id and must not render a dead /undefined link.
    expect(documentHref('pages', 99)).toBeNull()
    expect(documentHref('pages', { id: 99 })).toBeNull()
  })

  it('builds a meditation path from an id (bare or populated)', () => {
    expect(documentHref('meditations', 12)).toBe('/meditations/12')
    expect(documentHref('meditations', { id: 12, slug: null })).toBe('/meditations/12')
  })

  it('builds a lecture path from an id (bare or populated)', () => {
    expect(documentHref('lectures', 7)).toBe('/lectures/7')
    expect(documentHref('lectures', { id: 7, slug: null })).toBe('/lectures/7')
  })

  it('returns null for collections without a public web route', () => {
    expect(documentHref('albums', { id: 1 })).toBeNull()
    expect(documentHref('app-cards', { id: 1 })).toBeNull()
    expect(documentHref('forms', { id: 1 })).toBeNull()
  })

  it('returns null for an unknown collection slug', () => {
    expect(documentHref('something-else', { id: 1, slug: 'x' })).toBeNull()
  })
})

describe('matchDocumentRoute', () => {
  describe('full route', () => {
    it('matches /collection/:id and extracts the id', () => {
      expect(matchDocumentRoute('meditations', '/meditations/123')).toEqual({
        routeParams: { id: '123' },
      })
      expect(matchDocumentRoute('lectures', '/lectures/abc-def')).toEqual({
        routeParams: { id: 'abc-def' },
      })
    })

    // `+onBeforeRoute` strips a real locale before any route runs, so a
    // prefix that reaches the matcher is not one. Matching it would serve the
    // same page at a second address.
    it.each([
      ['an unknown code', '/zz/meditations/123'],
      ['a locale-shaped code', '/es/meditations/123'],
      ['a compound code', '/pt-BR/meditations/123'],
    ])('does not match a path under %s', (_label, pathname) => {
      expect(matchDocumentRoute('meditations', pathname)).toBe(false)
    })

    it('tolerates a trailing slash', () => {
      expect(matchDocumentRoute('meditations', '/meditations/123/')).toEqual({
        routeParams: { id: '123' },
      })
    })

    it('does NOT match the embed route (id is a single segment)', () => {
      expect(matchDocumentRoute('meditations', '/meditations/123/embed')).toBe(false)
    })

    it('rejects extra segments and a missing id', () => {
      expect(matchDocumentRoute('meditations', '/meditations/123/extra')).toBe(false)
      expect(matchDocumentRoute('meditations', '/meditations')).toBe(false)
      expect(matchDocumentRoute('meditations', '/meditations/')).toBe(false)
    })

    it('does not match a different collection', () => {
      expect(matchDocumentRoute('meditations', '/lectures/123')).toBe(false)
    })
  })

  describe('embed route', () => {
    it('matches /collection/:id/embed and extracts the id', () => {
      expect(matchDocumentRoute('meditations', '/meditations/123/embed', { embed: true })).toEqual({
        routeParams: { id: '123' },
      })
    })

    it('does not match an embed path under a prefix', () => {
      expect(matchDocumentRoute('lectures', '/zz/lectures/456/embed', { embed: true })).toBe(false)
      expect(matchDocumentRoute('lectures', '/de/lectures/456/embed', { embed: true })).toBe(false)
    })

    it('does NOT match the full route (requires the /embed suffix)', () => {
      expect(matchDocumentRoute('meditations', '/meditations/123', { embed: true })).toBe(false)
    })
  })
})
