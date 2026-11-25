import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

// The vectors are SahajCloud's (tests/unit/slugify.spec.ts); the recipe is
// shared across repos, so these must stay identical there.
describe('slugify — the shared cross-repo vectors', () => {
  it.each([
    ['Universität Trier', 'universität-trier'],
    ['Straße', 'straße'],
    ['São Paulo', 'são-paulo'],
    ['Küche', 'küche'],
    ['Meditasyonun çıkış noktası', 'meditasyonun-çıkış-noktası'],
    ['Москва', 'москва'],
    ['Τα οφέλη του διαλογισμού', 'τα-οφέλη-του-διαλογισμού'],
    ['Մաս 1. Ուղիներ', 'մաս-1-ուղիներ'],
    ['Ի՞նչ ակնկալել', 'ինչ-ակնկալել'],
    ['مدیتیشن چیست؟', 'مدیتیشن-چیست'],
    ['ध्यान क्या है', 'ध्यान-क्या-है'],
    ["Shri Mataji's Lectures", 'shri-matajis-lectures'],
    ['Yoga & Ruhe | 50%', 'yoga-ruhe-50'],
    ['8.1 What we share — in detail', '8-1-what-we-share-in-detail'],
    ['Hello World!', 'hello-world'],
    ['', ''],
    ['?! 🧘', ''],
  ])('%j → %j', (text, slug) => {
    expect(slugify(text)).toBe(slug)
  })

  it('composes a letter written as base plus combining mark (NFC)', () => {
    expect(slugify('Universität')).toBe('universität')
    expect(slugify('йога')).toBe('йога')
  })

  it('has no anchor for text without a letter or digit', () => {
    for (const text of ['   ', '?!', '— · —', '🧘']) {
      expect(slugify(text)).toBe('')
    }
  })
})
