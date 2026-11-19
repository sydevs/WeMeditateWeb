/**
 * URL-safe anchor slugification, shared by the RichText heading converter and
 * the `table-of-contents` block so a ToC entry's anchor always matches the
 * `id` emitted on the corresponding heading.
 */

/** Combining diacritical marks (U+0300–U+036F) and the letter they follow,
 * built from ASCII to avoid literal combining characters living in source. */
const MARKED_LETTER = new RegExp('(\\p{L}?)([\\u0300-\\u036f]+)', 'gu')

const LATIN_OR_COMMON = /[\p{Script=Latin}\p{Script=Common}]/u

/** Armenian writes its emphasis, exclamation and question marks inside the
 * word they apply to (Ի՞նչ). */
const ARMENIAN_IN_WORD_MARKS = new RegExp('[\\u055b\\u055c\\u055e]', 'g')

/**
 * A run of anything that is not a letter, mark or digit, or that is a Latin
 * or script-neutral character outside a–z and 0–9. The second half holds a
 * Latin anchor to a–z and 0–9 (ß, ı and œ split a word), so a Latin anchor
 * already in a shared link or an editor's `#` link keeps resolving.
 */
const SEPARATORS = /(?:(?![a-z0-9])(?:[^\p{L}\p{M}\p{N}]|[\p{Script=Latin}\p{Script=Common}]))+/gu

/**
 * Turns heading text into a URL-safe anchor id. Latin diacritics fold
 * before stripping (for example, é becomes e); a letter of any other script
 * keeps its marks (й stays й). Text with no letter or digit collapses to '',
 * and callers should treat an empty id as "no anchor".
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(MARKED_LETTER, (_, base: string, marks: string) =>
      base && !LATIN_OR_COMMON.test(base) ? base + marks : base,
    )
    .normalize('NFC')
    .replace(ARMENIAN_IN_WORD_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(SEPARATORS, '-')
    .replace(/^-+|-+$/g, '')
}
