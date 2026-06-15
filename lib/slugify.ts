/**
 * URL-safe anchor slugification, shared by the RichText heading converter and
 * the `table-of-contents` block so a ToC entry's anchor always matches the
 * `id` emitted on the corresponding heading.
 */

/** Combining diacritical marks (U+0300–U+036F), built from ASCII to avoid
 * literal combining characters living in source. */
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

/**
 * Turn heading text into a URL-safe anchor id. Latin diacritics are folded
 * (é → e) before stripping; fully non-latin scripts collapse to '' (callers
 * should treat an empty id as "no anchor").
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
