import { describe, expect, it } from 'vitest'

import { lookupIn, type LegacyRedirectMap } from './core'
import { lookupLegacyRedirect } from './lookup'

const MAP: LegacyRedirectMap = {
  pages: {
    '1': ['', 'ru'],
    '2': ['privacy-notice', 'fr pt-BR'],
    '3': ['inspiration', ''],
    '4': ['what-is-meditation', 'fr ru'],
    '5': ['chakras-channels', 'fr'],
    '6': ['meditate-now', ''],
    '7': ['live-meditations', 'ru'],
    '8': ['techniques', 'fr'],
  },
  roles: {
    home: 1,
    articles: 3,
    inspiration: 3,
    meditations: 6,
    techniques: 8,
    subtle_system: 5,
    music: 3,
    streams: 7,
    about: 1,
    contact: 1,
    shri_mataji: 1,
    sahaja_yoga: 1,
    privacy: 2,
    classes: 3,
  },
  words: {
    en: {
      privacy: 'privacy',
      all: 'archive',
      'first-experience': 'self_realization',
      random: 'random',
      live: 'streams',
      streams: 'streams',
      articles: 'articles',
      meditations: 'meditations',
      'subtle-system': 'subtle_system',
      techniques: 'techniques',
      inspiration: 'inspiration',
    },
    fr: {
      méditations: 'meditations',
      tout: 'archive',
      'politique-de-confidentialite': 'privacy',
      'système-subtil': 'subtle_system',
    },
    ru: {},
    el: { 'το-λεπτό-σύστημα': 'subtle_system', άρθρα: 'articles' },
    fa: { مقالات: 'articles' },
  },
  exact: {
    article: {
      en: { 'what-is-meditation': 4, 'old-slug': -1, divine_mother: 4 },
      fr: { 'ancien-slug': 4, 'sans-page': -1 },
      ru: { 'что-такое': 4 },
      tr: { 'meditasyon-nedir': 4 },
      el: { 'τι-είναι-διαλογισμός': 4 },
      fa: { 'مدیتیشن-چیست': 4 },
      'pt-br': { 'o-que-e': 4 },
    },
    category: { en: { stories: -1 }, fr: { histoires: -1 } },
    meditation: { en: { 'feel-calm': 33, 'video-only': -1 } },
    treatment: { en: { 'foot-soak': -1 } },
    subtle: {},
    stream: { ru: { sovremennik: -1 } },
    promo: { en: { app: -1, course: 4 }, ru: { курс: -1 } },
    event: { en: { 'summer-gathering': -1 } },
  },
}

const look = (path: string) => lookupIn(MAP, path)

describe('lookupIn', () => {
  it('sends an English record to its page', () => {
    expect(look('/articles/what-is-meditation')).toBe('/what-is-meditation')
  })

  it('keeps the visitor in their language when the page is published there', () => {
    expect(look('/fr/articles/ancien-slug')).toBe('/fr/what-is-meditation')
    expect(look('/ru/articles/что-такое')).toBe('/ru/what-is-meditation')
  })

  it('falls back to the English page when a launch language has not published it', () => {
    expect(look('/pt-br/articles/o-que-e')).toBe('/what-is-meditation')
    expect(look('/pt-BR/articles/o-que-e')).toBe('/what-is-meditation')
  })

  it('sends a language the site does not launch to the English page', () => {
    expect(look('/tr/articles/meditasyon-nedir')).toBe('/what-is-meditation')
  })

  it('sends a record with no page to its section, in the visitor language if the section is published there', () => {
    expect(look('/articles/old-slug')).toBe('/inspiration')
    expect(look('/inspiration/stories')).toBe('/inspiration')
    expect(look('/articles/category/stories')).toBe('/inspiration')
    expect(look('/fr/inspiration/histoires')).toBe('/inspiration')
    expect(look('/techniques/foot-soak')).toBe('/techniques')
    expect(look('/ru/live/sovremennik')).toBe('/ru/live-meditations')
    expect(look('/meditations/video-only')).toBe('/meditate-now')
  })

  it('sends a promo page with no page to the home page, and an event to the articles section', () => {
    expect(look('/app')).toBe('/')
    expect(look('/ru/курс')).toBe('/ru')
    expect(look('/summer-gathering')).toBe('/inspiration')
  })

  it('sends a matched meditation to its numeric address', () => {
    expect(look('/meditations/feel-calm')).toBe('/meditations/33')
  })

  it('translates the section word per language, and accepts the English word too', () => {
    expect(look('/fr/méditations/tout')).toBe('/meditate-now')
    expect(look('/fr/meditations/all')).toBe('/meditate-now')
    expect(look('/fr/politique-de-confidentialite')).toBe('/fr/privacy-notice')
    expect(look('/meditations/first-experience')).toBe('/meditate-now')
    expect(look('/meditations/random')).toBe('/meditate-now')
  })

  it('handles the fixed old routes', () => {
    expect(look('/privacy')).toBe('/privacy-notice')
    expect(look('/live')).toBe('/live-meditations')
    expect(look('/streams')).toBe('/live-meditations')
    expect(look('/streams/anything')).toBeNull()
    expect(look('/surrey')).toBe('/live-meditations')
    expect(look('/ru/surrey')).toBeNull()
    expect(look('/sitemap.xml.gz')).toBe('/sitemap.xml')
    expect(look('/fr/sitemap.xml.gz')).toBe('/sitemap.xml')
    expect(look('/map/gb/london/1204')).toBe('/map')
    expect(look('/de/map')).toBe('/map')
  })

  it('sends a bare language prefix to that language home page, or English where it is not published', () => {
    expect(look('/fr')).toBe('/')
    expect(look('/fr/')).toBe('/')
    expect(look('/en')).toBe('/')
    expect(look('/tr')).toBe('/')
    expect(look('/ru/курс')).toBe('/ru')
    expect(look('/ru')).toBeNull()
  })

  it('ignores a trailing slash and the case of the language prefix and the slug', () => {
    expect(look('/articles/what-is-meditation/')).toBe('/what-is-meditation')
    expect(look('/FR/Articles/Ancien-Slug')).toBe('/fr/what-is-meditation')
    expect(look('/Divine_Mother')).toBeNull()
    expect(look('/articles/DIVINE_MOTHER')).toBe('/what-is-meditation')
  })

  it('reads percent-encoded and non-ASCII segments, in any Unicode form', () => {
    const cyrillic = encodeURIComponent('что-такое')

    expect(look(`/ru/articles/${cyrillic}`)).toBe('/ru/what-is-meditation')
    expect(look('/ru/articles/что-такое')).toBe('/ru/what-is-meditation')
    expect(look('/el/άρθρα/τι-είναι-διαλογισμός')).toBe('/what-is-meditation')
    expect(
      look(`/el/${encodeURIComponent('άρθρα')}/${encodeURIComponent('τι-είναι-διαλογισμός')}`),
    ).toBe('/what-is-meditation')
    expect(look(`/fa/${encodeURIComponent('مقالات')}/${encodeURIComponent('مدیتیشن-چیست')}`)).toBe(
      '/what-is-meditation',
    )
    // "é" written as "e" + U+0301
    expect(look('/fr/méditations/tout')).toBe('/meditate-now')
    expect(look('/fr/m%C3%A9ditations')).toBe('/meditate-now')
    expect(look('/fr/me%CC%81ditations')).toBe('/meditate-now')
  })

  it('treats a word with spaces as dashed', () => {
    expect(look(`/el/${encodeURIComponent('το λεπτό σύστημα')}`)).toBe('/chakras-channels')
  })

  it('returns null for what the old site never had', () => {
    expect(look('/')).toBeNull()
    expect(look('/nothing-here')).toBeNull()
    expect(look('/articles/nothing-here')).toBeNull()
    expect(look('/articles/what-is-meditation/extra')).toBeNull()
    expect(look('/fr/articles/what-is-meditation')).toBeNull()
    expect(look('/zz/articles/old-slug')).toBeNull()
  })

  it('returns null for a malformed path and for names an object inherits', () => {
    expect(look('/%E0%A4%A')).toBeNull()
    expect(look('/articles/%2F')).toBeNull()
    expect(look('no-slash')).toBeNull()
    expect(look('//')).toBeNull()
    expect(look('/__proto__')).toBeNull()
    expect(look('/constructor')).toBeNull()
    expect(look('/articles/constructor')).toBeNull()
    expect(look('/articles/__proto__')).toBeNull()
    expect(look('/hasOwnProperty/toString')).toBeNull()
  })

  it('never returns the request itself', () => {
    expect(look('/inspiration')).toBeNull()
    expect(look('/techniques')).toBeNull()
    expect(look('/map')).toBeNull()
    expect(look('/inspiration/')).toBeNull()
    expect(look('/fr/techniques')).toBeNull()
  })
})

describe('lookupLegacyRedirect', () => {
  it('maps the five internal links that 404 on the new site today', () => {
    expect(lookupLegacyRedirect('/app')).toBe('/')
    expect(lookupLegacyRedirect('/classes')).toBe('/classes-near-me')
    expect(lookupLegacyRedirect('/live')).toBe('/live-meditations')
    expect(lookupLegacyRedirect('/meditations')).toBe('/meditate-now')
    expect(lookupLegacyRedirect('/music')).toBe('/music-for-meditation')
  })

  it('maps the renamed English addresses of the fixed pages', () => {
    expect(lookupLegacyRedirect('/privacy')).toBe('/privacy-notice')
    expect(lookupLegacyRedirect('/contact')).toBe('/contact-us')
    expect(lookupLegacyRedirect('/articles')).toBe('/inspiration')
    expect(lookupLegacyRedirect('/techniques/foot-soak')).toBe('/techniques')
    expect(lookupLegacyRedirect('/subtle-system/heart-chakra')).toBe('/heart-chakra')
  })

  it('maps the translated meditations index of another language to the English page', () => {
    expect(lookupLegacyRedirect('/fr/m%C3%A9ditations')).toBe('/meditate-now')
    expect(lookupLegacyRedirect('/pt-br/meditations/all')).toBe('/meditate-now')
  })

  it('answers the old sitemaps', () => {
    expect(lookupLegacyRedirect('/sitemap.xml.gz')).toBe('/sitemap.xml')
    expect(lookupLegacyRedirect('/it/sitemap.xml.gz')).toBe('/sitemap.xml')
  })
})
