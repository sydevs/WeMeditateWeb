import { describe, it, expect } from 'vitest'
import { UNREACHABLE_WORDS, VIDEO_LAYOUT_KEYS, videoLayoutTranslations } from './labels'
import { enT, getT } from '../../../lib/i18n'
import type { WebTranslations } from '../../../server/sahajcloud-types'

describe('videoLayoutTranslations', () => {
  it('renders each English word as itself', () => {
    // SahajCloud seeded this copy from Vidstack's own English, so in English
    // the map is an identity. That is what catches a key pointing at the
    // wrong string: `Settings → video.general.quality` resolves fine and
    // renders "Quality" on the settings button. Case is excluded, because
    // the reused `blocks.a11y.*` strings are sentence case.
    const wrong = Object.entries(videoLayoutTranslations(enT)).filter(
      ([word, value]) => value.toLowerCase() !== word.toLowerCase(),
    )

    expect(wrong).toEqual([])
  })

  it('covers every word the map claims', () => {
    expect(Object.keys(videoLayoutTranslations(enT)).sort()).toEqual(
      Object.keys(VIDEO_LAYOUT_KEYS).sort(),
    )
  })

  it('keys the result by the English phrase Vidstack looks up', () => {
    const translations = videoLayoutTranslations(enT)

    // `i18n(translations, word) => translations?.[word] ?? word`, so a key
    // spelled any other way silently falls through to Vidstack's English.
    expect(translations).toHaveProperty(['Captions look like this'])
    expect(translations).toHaveProperty(['Closed-Captions On'])
    expect(translations).toHaveProperty(['Enter PiP'])
  })

  it('reuses the bank for every control the rest of the site already names', () => {
    // #82: do not seed a second copy of a string the bank renders. A key
    // under `video.` for one of these seven is a duplicate a translator
    // has to fill twice, and the two players drift from that point on.
    const reused = [
      'Play',
      'Pause',
      'Mute',
      'Unmute',
      'Volume',
      'Enter Fullscreen',
      'Exit Fullscreen',
    ] as const

    for (const word of reused) {
      expect(VIDEO_LAYOUT_KEYS[word]).not.toMatch(/^video\./)
    }
  })

  it('omits every word this player cannot reach, so Vidstack keeps its own English', () => {
    const translations = videoLayoutTranslations(enT)

    for (const word of UNREACHABLE_WORDS) {
      expect(translations).not.toHaveProperty([word])
    }
  })

  it('renders each word in the locale, not in English', () => {
    const fr = getT(
      {
        video: { a11y: { seek: 'Rechercher' } },
        media: { a11y: { play: 'Lecture', volume: 'Volume sonore' } },
      } as unknown as WebTranslations,
      'fr',
    )
    const translations = videoLayoutTranslations(fr)

    expect(translations.Play).toBe('Lecture')
    expect(translations.Seek).toBe('Rechercher')
    expect(translations.Volume).toBe('Volume sonore')
  })
})
