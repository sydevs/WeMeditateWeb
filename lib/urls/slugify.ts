/**
 * URL-safe anchor slugification, shared by the RichText heading converter and
 * the `table-of-contents` block so a ToC entry's anchor always matches the
 * `id` emitted on the corresponding heading.
 */

/** Combining diacritical marks (U+0300–U+036F), built from ASCII to avoid
 * literal combining characters living in source. */
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

const LATIN_OR_COMMON = /[\p{Script=Latin}\p{Script=Common}]/u

/** Folded one by one before the text decomposes, because µ and ℵ decompose
 * to a Greek and a Hebrew letter. */
const LATIN_OR_COMMON_CHAR = /[\p{Script=Latin}\p{Script=Common}]/gu

/** A run of combining marks, and the letter it follows if there is one. */
const MARKED_LETTER = /(\p{L}?)(\p{M}+)/gu

/** Armenian writes its emphasis, exclamation and question marks inside the
 * word they apply to (Ի՞նչ). */
const ARMENIAN_IN_WORD_MARKS = new RegExp('[\\u055b\\u055c\\u055e]', 'g')

/**
 * A run of anything that is not a letter, mark or digit, or that is a Latin
 * or script-neutral character outside a–z and 0–9. After the fold, only
 * another script's compatibility form leaves one of those (the tatweel in an
 * Arabic presentation form), and it splits as the typed character does.
 */
const SEPARATORS = /(?:(?![a-z0-9])(?:[^\p{L}\p{M}\p{N}]|[\p{Script=Latin}\p{Script=Common}]))+/gu

/**
 * Spells Latin or script-neutral text in a–z, 0–9 and '-', so a Latin anchor
 * already in a shared link or an editor's `#` link keeps resolving: é folds
 * to e, while ß, ı, œ, µ and an emoji's variation selector split a word.
 */
function foldLatin(text: string): string {
  return text
    .normalize('NFKD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}

/** A mark after a letter of another script is part of that letter (й, ά). */
function attachMarks(_: string, base: string, marks: string): string {
  return base && !LATIN_OR_COMMON.test(base) ? base + marks : base + foldLatin(marks)
}

/**
 * Turns heading text into a URL-safe anchor id. Latin diacritics fold
 * before stripping (for example, é becomes e); a letter of any other script
 * keeps its marks (й stays й). Text with no letter or digit collapses to '',
 * and callers should treat an empty id as "no anchor".
 */
export function slugify(text: string): string {
  return text
    .replace(LATIN_OR_COMMON_CHAR, foldLatin)
    .normalize('NFKD')
    .replace(MARKED_LETTER, attachMarks)
    .normalize('NFC')
    .replace(ARMENIAN_IN_WORD_MARKS, '')
    .toLowerCase()
    .replace(SEPARATORS, '-')
    .replace(/^-+|-+$/g, '')
}
