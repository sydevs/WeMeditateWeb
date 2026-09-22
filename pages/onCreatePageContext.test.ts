/**
 * The error page's locale fallback. `lib/urls.test.ts` owns the derivation
 * itself; this covers what the hook adds to it.
 *
 * No `+` prefix on the filename: Vike loads every `+`-prefixed file under
 * `pages/` as a config file and fails the build when one exports neither
 * `route` nor `default`. See docs/rules/testing.md.
 */

import { describe, it, expect } from 'vitest'
import type { PageContextServer } from 'vike/types'
import type { Locale } from '../server/sahajcloud-types'
import { onCreatePageContext } from './+onCreatePageContext.server'

function localeOf(urlOriginal: string, routed?: Locale): Locale {
  const pageContext = { urlOriginal, locale: routed } as unknown as PageContextServer

  onCreatePageContext(pageContext)

  return pageContext.locale
}

describe('onCreatePageContext', () => {
  it('recovers the locale a thrown render() lost', () => {
    expect(localeOf('/fa/meditations/1')).toBe('fa')
    expect(localeOf('/about')).toBe('en')
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
