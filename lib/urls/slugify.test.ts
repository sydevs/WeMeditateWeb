import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify — Latin', () => {
  // An anchor already shared, or typed into an editor's link, must keep
  // resolving, so these pin the Latin spelling. The headings are live
  // SahajCloud copy.
  it.each([
    ['Hello World!', 'hello-world'],
    ['When to do it?', 'when-to-do-it'],
    ['Café Société', 'cafe-societe'],
    ['La Kundalini est une Énergie Maternelle', 'la-kundalini-est-une-energie-maternelle'],
    ['Meditace -  Vnímejte klid uvnitř sebe', 'meditace-vnimejte-klid-uvnitr-sebe'],
    ['De cât timp este cunoscută meditația ?', 'de-cat-timp-este-cunoscuta-meditatia'],
    ['Meditazione e Conoscenza di Sé', 'meditazione-e-conoscenza-di-se'],
    ['8.1 What we share — in detail', '8-1-what-we-share-in-detail'],
  ])('%j → %j', (heading, anchor) => {
    expect(slugify(heading)).toBe(anchor)
  })

  it('folds a diacritic written as a separate combining mark', () => {
    expect(slugify('Café Société')).toBe('cafe-societe')
  })

  it('folds compatibility forms to their ASCII spelling', () => {
    expect(slugify('Part ½ of Ⅻ')).toBe('part-1-2-of-xii')
  })

  // A Latin letter with no ASCII decomposition splits the word, for the same reason.
  it.each([
    ['Meditasyonun çıkış noktası', 'meditasyonun-c-k-s-noktas'],
    ['Straße', 'stra-e'],
    ['Cœur', 'c-ur'],
    ['Łódź', 'odz'],
    ['Hawaiʻi', 'hawai-i'],
  ])('%j still spells %j', (heading, anchor) => {
    expect(slugify(heading)).toBe(anchor)
  })

  // So does an emoji's variation selector or keycap, a mark after a Latin
  // letter outside U+0300–U+036F, and the micro sign, which decomposes to a
  // Greek letter.
  it.each([
    ['We \u2764\ufe0f meditation', 'we-meditation'],
    ['Step 1\ufe0f\u20e3', 'step-1'],
    ['\u{1f9d8}\u200d\u2640\ufe0f Yoga', 'yoga'],
    ['Vector v\u20d7 field', 'vector-v-field'],
    ['Tip: 5\u00b5m', 'tip-5-m'],
  ])('%j still spells %j', (heading, anchor) => {
    expect(slugify(heading)).toBe(anchor)
  })
})

describe('slugify — other scripts', () => {
  it.each([
    ['Какво е Кундалини?', 'какво-е-кундалини'],
    ['Има ли най-добро време за медитация?', 'има-ли-най-добро-време-за-медитация'],
    ['Про ілюстрації', 'про-ілюстрації'],
    ['Τα οφέλη του διαλογισμού', 'τα-οφέλη-του-διαλογισμού'],
    ['Πώς  επιδρά ο Διαλογισμός επάνω  μας', 'πώς-επιδρά-ο-διαλογισμός-επάνω-μας'],
    ['Մաս 1. Ուղիներ', 'մաս-1-ուղիներ'],
    ['مدیتیشن چیست؟', 'مدیتیشن-چیست'],
    ['مرحله ۱: آغاز', 'مرحله-۱-آغاز'],
  ])('%j → %j', (heading, anchor) => {
    expect(slugify(heading)).toBe(anchor)
  })

  it('keeps a non-Latin letter whole, composing one written as base plus mark', () => {
    expect(slugify('йога')).toBe('йога')
  })

  it('drops the Armenian marks written inside a word, rather than splitting it', () => {
    expect(slugify('Ի՞նչ ակնկալել դասընթացներից')).toBe('ինչ-ակնկալել-դասընթացներից')
  })

  it('splits a Persian word at a zero-width non-joiner', () => {
    expect(slugify('می‌خواهم')).toBe('می-خواهم')
  })
})

describe('slugify — no anchor', () => {
  it.each(['', '   ', '?!', '— · —', '🧘', '\u2764\ufe0f', '\u{1f9d8}\u200d\u2640\ufe0f'])(
    '%j has no letter or digit, so it is ""',
    (heading) => {
      expect(slugify(heading)).toBe('')
    },
  )
})
