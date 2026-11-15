import { describe, it, expect } from 'vitest'
import { localeEndonym, formatList } from './locale-names'

describe('localeEndonym', () => {
  it('names a language in itself, capitalised', () => {
    expect(localeEndonym('fr')).toBe('Français')
    expect(localeEndonym('de')).toBe('Deutsch')
  })

  it('capitalises by the language own rules', () => {
    // Turkish dotless/dotted `i`: `toUpperCase()` would give "Turkce"'s `I`.
    expect(localeEndonym('tr').charAt(0)).toBe('T')
    expect(localeEndonym('it')).toBe('Italiano')
  })

  it('names a subtitle track language the site is not offered in', () => {
    // A video may carry a track in any BCP-47 tag, not only a site locale.
    expect(localeEndonym('sv')).toBe('Svenska')
    expect(localeEndonym('pt-BR')).not.toBe('pt-BR')
  })

  it('falls back to the raw tag rather than throwing on a malformed one', () => {
    expect(localeEndonym('not a tag')).toBe('not a tag')
  })
})

describe('formatList', () => {
  it('joins with the locale own conjunction', () => {
    expect(formatList(['a', 'b', 'c'], 'en')).toBe('a, b, and c')
    expect(formatList(['a', 'b'], 'fr')).toBe('a et b')
  })
})
