import { describe, it, expect } from 'vitest'
import { buildWebManifest } from './manifest'
import { enT } from '@/lib/i18n/i18n'
import { THEME_COLOR } from '@/lib/seo/site-identity'

const ORIGIN = 'https://wemeditate.com'

const manifest = (locale: 'en' | 'fr' = 'en') =>
  buildWebManifest({ origin: ORIGIN, locale, t: enT })

describe('buildWebManifest', () => {
  it('names the site from SahajCloud, never a literal', () => {
    expect(manifest().name).toBe(enT('common.general.site_title'))
    expect(manifest().description).toBe(enT('common.general.site_description'))
  })

  it('starts in the locale that asked for it', () => {
    expect(manifest('fr').start_url).toBe(`${ORIGIN}/fr`)
    expect(manifest('fr').lang).toBe('fr')
  })

  it('opens in the browser, so a visitor is never stranded with no chrome', () => {
    expect(manifest().display).toBe('browser')
  })

  it('carries the theme colour and one square icon', () => {
    expect(manifest().theme_color).toBe(THEME_COLOR)
    expect(manifest().icons).toEqual([
      {
        src: '/images/metadata/icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ])
  })
})
