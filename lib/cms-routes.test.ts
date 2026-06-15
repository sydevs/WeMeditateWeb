import { describe, it, expect } from 'vitest'
import { cmsHref, refId, refSlug } from './cms-routes'

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

describe('cmsHref', () => {
  it('builds a page path from a populated page with a slug', () => {
    expect(cmsHref('pages', { id: 1, slug: 'about' })).toBe('/about')
  })

  it('returns null for a page reference with no slug (unpublished / bare id)', () => {
    // A published page populates into an object with a slug; an unpublished one
    // comes back as a bare id and must not render a dead /undefined link.
    expect(cmsHref('pages', 99)).toBeNull()
    expect(cmsHref('pages', { id: 99 })).toBeNull()
  })

  it('builds a meditation path from an id (bare or populated)', () => {
    expect(cmsHref('meditations', 12)).toBe('/meditations/12')
    expect(cmsHref('meditations', { id: 12, slug: null })).toBe('/meditations/12')
  })

  it('returns null for collections without a public web route', () => {
    expect(cmsHref('lectures', { id: 1 })).toBeNull()
    expect(cmsHref('albums', { id: 1 })).toBeNull()
    expect(cmsHref('app-cards', { id: 1 })).toBeNull()
    expect(cmsHref('forms', { id: 1 })).toBeNull()
  })

  it('returns null for an unknown collection slug', () => {
    expect(cmsHref('something-else', { id: 1, slug: 'x' })).toBeNull()
  })
})
