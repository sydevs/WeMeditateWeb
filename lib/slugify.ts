/**
 * URL-safe anchor slugification, shared by the RichText heading converter and
 * the `table-of-contents` block so a ToC entry's anchor always matches the
 * `id` emitted on the corresponding heading.
 */

/** Combining diacritical marks (U+0300–U+036F), built from ASCII to avoid
 * literal combining characters living in source. */
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

/**
 * Turns heading text into a URL-safe anchor id. Latin diacritics fold
 * before stripping (for example, é becomes e). A fully non-latin script
 * collapses to ''. Callers should treat an empty id as "no anchor".
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
