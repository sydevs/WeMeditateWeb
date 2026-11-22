import { describe, expect, it } from 'vitest'
import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { EN_A11Y, overEnglish, withA11y, type A11yFile } from './a11y'
import { A11Y_FILES, a11yStringsFor } from './catalog'
import context from './context.json'
import snapshot from '@/lib/i18n/translations.en.json'
import { LOCALES } from '@/lib/i18n/locales'
import type { Locale } from '@/types/sahajcloud'

/**
 * The screen-reader files are machine-translated by whoever adds a key, with no
 * translator to catch a gap. These checks are the review: every locale has every
 * key, in its own plural forms, with the English placeholders.
 */

const PLURAL = /_(zero|one|two|few|many|other)$/

const tabs = Object.keys(EN_A11Y) as (keyof typeof EN_A11Y)[]

/** Base names of the English plural families (`show_more_items`). */
function pluralBases(group: Record<string, string>): Set<string> {
  return new Set(
    Object.keys(group)
      .filter((key) => key.endsWith('_other'))
      .map((key) => key.replace(PLURAL, '')),
  )
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/%\{(\w+)\}/g)].map((match) => match[1]).sort()
}

/** Every key a locale's file must hold: English's plain keys, and its own plural forms. */
function expectedKeys(locale: string, tab: keyof typeof EN_A11Y): string[] {
  const english = EN_A11Y[tab] as Record<string, string>
  const bases = pluralBases(english)
  const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories
  const plain = Object.keys(english).filter((key) => !bases.has(key.replace(PLURAL, '')))

  return [...plain, ...[...bases].flatMap((base) => categories.map((c) => `${base}_${c}`))].sort()
}

const isEnglishVariant = (locale: string) => locale.split('-')[0] === 'en'

const translated = Object.entries(A11Y_FILES) as [Locale, A11yFile][]

describe('screen-reader files', () => {
  it('holds a file for every locale SahajCloud defines, bar English variants', () => {
    const missing = LOCALES.filter((locale) => !isEnglishVariant(locale) && !A11Y_FILES[locale])

    expect(missing).toEqual([])
  })

  it('registers every file in the folder', () => {
    const folder = dirname(fileURLToPath(import.meta.url))
    const onDisk = readdirSync(folder)
      .filter((name) => name.endsWith('.json') && !['en.json', 'context.json'].includes(name))
      .map((name) => name.replace(/\.json$/, ''))
      .sort()

    expect(onDisk).toEqual(Object.keys(A11Y_FILES).sort())
  })

  it.each(translated)('%s holds every key, in its own plural forms', (locale, file) => {
    for (const tab of tabs) {
      expect(Object.keys(file[tab] ?? {}).sort(), `${locale} ${tab}`).toEqual(
        expectedKeys(locale, tab),
      )
    }
  })

  it.each(translated)("%s keeps each English key's placeholders", (locale, file) => {
    const wrong: string[] = []

    for (const tab of tabs) {
      const english = EN_A11Y[tab] as Record<string, string>

      for (const [key, value] of Object.entries(file[tab] ?? {})) {
        const source = english[key] ?? english[key.replace(PLURAL, '_other')]

        if (value.trim() !== value || value === '') wrong.push(`${tab}.${key}: blank or padded`)
        if (source && placeholders(value).join() !== placeholders(source).join()) {
          wrong.push(
            `${tab}.${key}: ${placeholders(value).join()} ≠ ${placeholders(source).join()}`,
          )
        }
      }
    }

    expect(wrong).toEqual([])
  })

  it('describes every English key for the next translator', () => {
    for (const tab of tabs) {
      const english = EN_A11Y[tab] as Record<string, string>
      const bases = pluralBases(english)
      const keys = Object.keys(english).map((key) =>
        bases.has(key.replace(PLURAL, '')) ? key.replace(PLURAL, '') : key,
      )
      const described = (context as Record<string, Record<string, string>>)[tab] ?? {}

      expect(Object.keys(described).sort(), tab).toEqual([...new Set(keys)].sort())
      expect(Object.values(described).filter((text) => text.trim() === '')).toEqual([])
    }
  })

  it('leaves the SahajCloud snapshot without an a11y group', () => {
    // The boundary: a string only a screen reader speaks lives here, never upstream.
    const carrying = Object.entries(snapshot)
      .filter(([, group]) => typeof group === 'object' && group !== null && 'a11y' in group)
      .map(([tab]) => tab)

    expect(carrying).toEqual([])
  })
})

describe('a11yStringsFor', () => {
  it('reads English for an English variant', () => {
    expect(a11yStringsFor('en-AU')).toBe(EN_A11Y)
  })

  it("reads a locale's own words", () => {
    expect(a11yStringsFor('de').media.play).not.toBe(EN_A11Y.media.play)
  })
})

describe('overEnglish', () => {
  it('reads English for a key the file lacks', () => {
    const strings = overEnglish({ media: { play: 'Lire' } })

    expect(strings.media.play).toBe('Lire')
    expect(strings.media.pause).toBe(EN_A11Y.media.pause)
    expect(strings.common).toEqual(EN_A11Y.common)
  })
})

describe('withA11y', () => {
  it("mounts a tab's a11y group beside its other groups", () => {
    const result = withA11y<object, Record<string, Record<string, unknown>>>(
      { media: { general: { playlist: 'Playlist' } } },
      EN_A11Y,
    )

    expect(result.media.general).toEqual({ playlist: 'Playlist' })
    expect(result.media.a11y).toBe(EN_A11Y.media)
  })

  it('gives a tab the base lacks its a11y group alone', () => {
    const result = withA11y<object, Record<string, Record<string, unknown>>>({}, EN_A11Y)

    expect(result.errors).toEqual({ a11y: EN_A11Y.errors })
  })
})
