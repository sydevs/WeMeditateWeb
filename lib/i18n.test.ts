/**
 * The accessor itself: interpolation, plurals, missing keys, and rich nodes.
 *
 * Every other suite in the repo renders with the English snapshot, so these
 * are the cases that prove a non-English locale actually changes what
 * renders — not just that English still works.
 */

import { describe, it, expect } from 'vitest'
import type { WebTranslations } from '../server/cms-types'
import { createT, EN_TRANSLATIONS, interpolate, pluralize } from './i18n'

/** A partial translations object, shaped like a CMS read. */
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

  it('falls back to the key path when a key is missing', () => {
    // A gap must be visible on the page, not render as a blank element.
    const t = createT(fixture({ common: { general: {}, a11y: {} } }), 'en')

    expect(t('common.general.loading')).toBe('common.general.loading')
  })

  it('falls back to the key path when a key is present but blank', () => {
    const t = createT(fixture({ common: { general: { loading: '' }, a11y: {} } }), 'en')

    expect(t('common.general.loading')).toBe('common.general.loading')
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
