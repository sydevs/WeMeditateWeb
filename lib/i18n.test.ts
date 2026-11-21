/**
 * The accessor itself: interpolation, plurals, missing keys, and rich nodes.
 *
 * Every other suite in the repo renders with the English snapshot, so these
 * are the cases that prove a non-English locale actually changes what
 * renders — not just that English still works.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import * as Sentry from '@sentry/react'
import type { WebTranslations } from '../server/sahajcloud-types'
import { forgetReportedWarnings } from '../server/error-utils'
import { createT, EN_TRANSLATIONS, interpolate, pluralize, type TranslationKey } from './i18n'

vi.mock('@sentry/react', () => ({ captureMessage: vi.fn() }))

/** A partial translations object, shaped like a SahajCloud read. */
const fixture = (groups: Record<string, unknown>) => groups as unknown as WebTranslations

describe('interpolate', () => {
  it('substitutes every named placeholder', () => {
    expect(interpolate('Written by %{name}', { name: 'Gabriel' })).toBe('Written by Gabriel')
    expect(interpolate('%{a} and %{b}', { a: '1', b: '2' })).toBe('1 and 2')
  })

  it('leaves an unmatched placeholder in place, rather than blanking it', () => {
    // A hole in the sentence is invisible; the literal placeholder is not.
    expect(interpolate('Written by %{name}', {})).toBe('Written by %{name}')
  })

  it('coerces a number parameter', () => {
    expect(interpolate('%{count} min', { count: 7 })).toBe('7 min')
  })
})

describe('pluralize', () => {
  it("picks English's one/other forms", () => {
    const forms = { one: '%{count} year', other: '%{count} years' }

    expect(pluralize(forms, 1, 'en')).toBe('%{count} year')
    expect(pluralize(forms, 3, 'en')).toBe('%{count} years')
    expect(pluralize(forms, 0, 'en')).toBe('%{count} years')
  })

  it("uses the locale's own rules, not English's", () => {
    // Russian selects `few` for 3, where English would select `other`.
    const forms = { one: 'год', few: 'года', many: 'лет', other: 'года' }

    expect(pluralize(forms, 1, 'ru')).toBe('год')
    expect(pluralize(forms, 3, 'ru')).toBe('года')
    expect(pluralize(forms, 5, 'ru')).toBe('лет')
  })

  it('falls back to a populated form when the selected one is blank', () => {
    // English fills `_one` and `_other` only, so a locale selecting `few`
    // must still render something.
    expect(pluralize({ one: 'item', other: 'items' }, 3, 'ru')).toBe('items')
    expect(pluralize({}, 1, 'en')).toBeUndefined()
  })
})

describe('createT', () => {
  it('reads a nested and a flat key', () => {
    const t = createT(EN_TRANSLATIONS, 'en')

    expect(t('common.general.loading')).toBe('Loading...')
    expect(t('footer.info')).toBe('Info')
  })

  it('renders the locale it is given, not English', () => {
    const t = createT(
      fixture({
        common: { general: { loading: 'Chargement...' }, a11y: {} },
        footer: { info: 'Infos' },
      }),
      'fr',
    )

    expect(t('common.general.loading')).toBe('Chargement...')
    expect(t('footer.info')).toBe('Infos')
  })

  it('interpolates named parameters', () => {
    const t = createT(fixture({ footer: { copyright: '© WeMeditate, %{year}' } }), 'en')

    expect(t('footer.copyright', { year: 2026 })).toBe('© WeMeditate, 2026')
  })

  it('resolves a plural family from its base key', () => {
    const t = createT(
      fixture({
        article: {
          general: {
            meditating_years_one: 'Meditating for %{count} year',
            meditating_years_other: 'Meditating for %{count} years',
          },
          a11y: {},
        },
      }),
      'en',
    )

    expect(t('article.general.meditating_years', { count: 1 })).toBe('Meditating for 1 year')
    expect(t('article.general.meditating_years', { count: 9 })).toBe('Meditating for 9 years')
  })

  it("selects the plural form by the locale's rules", () => {
    const t = createT(
      fixture({
        map: {
          general: {
            classes_shown_one: '%{shown} из %{count} класса',
            classes_shown_few: '%{shown} из %{count} классов',
            classes_shown_many: '%{shown} из %{count} классов подряд',
            classes_shown_other: '%{shown} из %{count} класса',
          },
          a11y: {},
        },
      }),
      'ru',
    )

    expect(t('map.general.classes_shown', { shown: 2, count: 3 })).toBe('2 из 3 классов')
    expect(t('map.general.classes_shown', { shown: 2, count: 7 })).toBe('2 из 7 классов подряд')
  })

  describe('a key the locale lacks', () => {
    // `warnOnce`'s memo lives as long as the isolate, so each case starts from
    // a fresh one rather than inheriting the keys its neighbours missed.
    beforeEach(() => {
      forgetReportedWarnings()
      vi.mocked(Sentry.captureMessage).mockClear()
    })

    afterEach(() => {
      vi.unstubAllEnvs()
      vi.restoreAllMocks()
    })

    it('renders the English mirror, never the key path', () => {
      // A half-translated group is what SahajCloud returns: the group is
      // there, one of its keys is not.
      vi.stubEnv('DEV', false)
      const t = createT(fixture({ blocks: { general: { learn_more: 'En savoir plus' } } }), 'fr')

      expect(t('blocks.general.minutes')).toBe(EN_TRANSLATIONS.blocks.general.minutes)
      expect(t('blocks.general.learn_more')).toBe('En savoir plus')
    })

    it('renders the mirror for a key present but blank', () => {
      vi.stubEnv('DEV', false)
      const t = createT(fixture({ common: { general: { loading: '' }, a11y: {} } }), 'fr')

      expect(t('common.general.loading')).toBe(EN_TRANSLATIONS.common.general.loading)
    })

    it("takes the mirror's plural form by English rules", () => {
      // Russian files 21 under `one`; English must not ("Show 21 more item").
      vi.stubEnv('DEV', false)
      const t = createT(fixture({ common: { general: {}, a11y: {} } }), 'ru')

      expect(t('common.a11y.show_more_items', { count: 21 })).toBe('Show 21 more items')
    })

    it('renders nothing in production when the mirror lacks it too', () => {
      vi.stubEnv('DEV', false)
      const t = createT(fixture({}), 'fr')
      const missing = 'common.general.no_such_key' as TranslationKey

      expect(t(missing)).toBe('')
      expect(t.rich(missing, { name: 'NODE' })).toEqual([])
    })

    it('renders the key path in development, where a gap should be loud', () => {
      vi.stubEnv('DEV', true)
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const t = createT(fixture({}), 'fr')
      const missing = 'common.general.no_such_key' as TranslationKey

      expect(t(missing)).toBe('common.general.no_such_key')
      expect(t.rich(missing, {})).toEqual(['common.general.no_such_key'])
    })

    it('tells Sentry whether the mirror filled it', () => {
      vi.stubEnv('DEV', false)
      const t = createT(fixture({}), 'fr')

      t('blocks.general.minutes')
      t('common.general.no_such_key' as TranslationKey)

      expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual([
        [
          'Translation key missing from SahajCloud',
          {
            level: 'warning',
            tags: { source: 'i18n', fallback: 'mirror' },
            extra: { key: 'blocks.general.minutes', locale: 'fr' },
          },
        ],
        [
          'Translation key missing from SahajCloud',
          {
            level: 'warning',
            tags: { source: 'i18n', fallback: 'none' },
            extra: { key: 'common.general.no_such_key', locale: 'fr' },
          },
        ],
      ])
    })

    it('reaches Sentry once per key per isolate, from every render that misses it', () => {
      vi.stubEnv('DEV', false)
      const live = fixture({ blocks: { general: { learn_more: 'Mehr' } } })

      createT(live, 'de')('blocks.general.minutes')
      createT(live, 'de')('blocks.general.minutes')
      createT(fixture({ ...live }), 'fr')('blocks.general.minutes')

      expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    })

    it('says nothing from the browser, where no isolate bounds the volume', () => {
      vi.stubEnv('DEV', false)
      vi.stubEnv('SSR', false)

      createT(fixture({}), 'fr')('blocks.general.minutes')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })

    it('does not report a key the locale has', () => {
      createT(EN_TRANSLATIONS, 'en')('common.general.loading')

      expect(Sentry.captureMessage).not.toHaveBeenCalled()
    })
  })

  describe('rich', () => {
    it('splits the template around its placeholder node', () => {
      const t = createT(
        fixture({ article: { general: { written_by: 'Written by %{name}' } } }),
        'en',
      )

      expect(t.rich('article.general.written_by', { name: 'NODE' })).toEqual([
        'Written by ',
        'NODE',
      ])
    })

    it('keeps the text on both sides of a mid-sentence placeholder', () => {
      const t = createT(
        fixture({ errors: { general: { status_page_hint: 'Check our %{link} for updates.' } } }),
        'en',
      )

      expect(t.rich('errors.general.status_page_hint', { link: 'LINK' })).toEqual([
        'Check our ',
        'LINK',
        ' for updates.',
      ])
    })

    it('puts word order where the locale wants it, not where English does', () => {
      const t = createT(
        fixture({ article: { general: { written_by: '%{name} a écrit ceci' } } }),
        'fr',
      )

      expect(t.rich('article.general.written_by', { name: 'NODE' })).toEqual([
        'NODE',
        ' a écrit ceci',
      ])
    })

    it('leaves a placeholder with no node as literal text', () => {
      const t = createT(
        fixture({ article: { general: { written_by: 'Written by %{name}' } } }),
        'en',
      )

      expect(t.rich('article.general.written_by', {})).toEqual(['Written by ', '%{name}'])
    })
  })
})
