/**
 * The error page's locale fallback.
 *
 * No `+` prefix on the filename: Vike loads every `+`-prefixed file under
 * `pages/` as a config file and fails the build when one exports neither
 * `route` nor `default`. See docs/rules/testing.md.
 */

import { describe, it, expect } from 'vitest'
import type { PageContextServer } from 'vike/types'
import type { Locale } from '../server/cms-types'
import { onCreatePageContext } from './+onCreatePageContext.server'

/**
 * `urlOriginal` and an optional `locale` are the hook's only two reads.
 * Vike hands the hook the request's pageContext and keeps whatever it
 * writes back (`renderPageServer/loadPageConfigsLazyServerSide.js`).
 */
function localeOf(urlOriginal: string, routed?: Locale): Locale {
  const pageContext = { urlOriginal, locale: routed } as unknown as PageContextServer

  onCreatePageContext(pageContext)

  return pageContext.locale
}

describe('onCreatePageContext', () => {
  it('recovers the locale a thrown render() lost', () => {
    expect(localeOf('/fr/not-a-real-slug')).toBe('fr')
    expect(localeOf('/fa/meditations/1')).toBe('fa')
    expect(localeOf('/pt-BR/about')).toBe('pt-BR')
  })

  it('falls back to English for a path carrying no locale', () => {
    expect(localeOf('/about')).toBe('en')
    expect(localeOf('/')).toBe('en')
    // `zz` is no CMS locale, so this 404s through the route it matched.
    expect(localeOf('/zz/a/b/c')).toBe('en')
  })

  it('reads the path out of a URL that carries a query string', () => {
    expect(localeOf('/fr/search?q=meditation')).toBe('fr')
  })

  it('leaves a routed locale alone, so onBeforeRoute stays the one writer', () => {
    // `urlOriginal` disagreeing here is the point: wherever routing ran,
    // its answer wins, and this hook must not recompute one.
    expect(localeOf('/about', 'fr')).toBe('fr')
  })
})
