import { describe, it, expect } from 'vitest'
import { isSafeNavigationUrl, localeUrl, normalizeContentPath } from './urls'

const ORIGIN = 'https://wemeditate.com'

describe('normalizeContentPath', () => {
  it('collapses the routing spelling of the home page back to a URL', () => {
    // +onBeforeRoute rewrites `/` to `/index` before routing, and
    // urlPathname carries that through to the render. `/index` is not a URL
    // to point a crawler at.
    expect(normalizeContentPath('/index')).toBe('/')
    expect(normalizeContentPath('/')).toBe('/')
  })

  it('drops a trailing slash, so a page is not its own duplicate', () => {
    expect(normalizeContentPath('/about/')).toBe('/about')
  })

  it('falls back to the root for a missing path', () => {
    expect(normalizeContentPath(null)).toBe('/')
    expect(normalizeContentPath(undefined)).toBe('/')
    expect(normalizeContentPath('')).toBe('/')
  })
})

describe('localeUrl', () => {
  it('serves English bare, because /en/x 301s to /x', () => {
    // Advertising /en/about would advertise a redirect, which is the one
    // thing a canonical must never be (pages/+onBeforeRoute.ts:37-41).
    expect(localeUrl(ORIGIN, 'en', '/about')).toBe('https://wemeditate.com/about')
  })

  it('prefixes every other locale', () => {
    expect(localeUrl(ORIGIN, 'fr', '/about')).toBe('https://wemeditate.com/fr/about')
  })

  it('keeps a region-cased code exactly as the CMS stores it', () => {
    expect(localeUrl(ORIGIN, 'pt-BR', '/about')).toBe('https://wemeditate.com/pt-BR/about')
  })

  it('renders the home page as a bare prefix, which the router resolves', () => {
    expect(localeUrl(ORIGIN, 'en', '/')).toBe('https://wemeditate.com/')
    expect(localeUrl(ORIGIN, 'fr', '/')).toBe('https://wemeditate.com/fr')
  })
})

describe('isSafeNavigationUrl', () => {
  it('accepts a root-relative path and an http(s) URL', () => {
    expect(isSafeNavigationUrl('/thank-you')).toBe(true)
    expect(isSafeNavigationUrl('https://wemeditate.com/thanks')).toBe(true)
    expect(isSafeNavigationUrl('http://wemeditate.com/thanks')).toBe(true)
  })

  it('refuses a scheme that would execute rather than navigate', () => {
    expect(isSafeNavigationUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeNavigationUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('accepts an off-site URL, however it is spelled', () => {
    // An editor may send a visitor elsewhere, so `//host` and the `/\host`
    // browsers fold into it are the plain absolute URL by another name.
    expect(isSafeNavigationUrl('//other.example/thanks')).toBe(true)
    expect(isSafeNavigationUrl('/\\other.example/thanks')).toBe(true)
  })

  it('refuses anything that is neither', () => {
    expect(isSafeNavigationUrl('not a url')).toBe(false)
    expect(isSafeNavigationUrl('')).toBe(false)
  })
})
