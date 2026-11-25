/**
 * Heading text to a URL-safe anchor id, keeping native letters in any script.
 *
 * ⚠ The cross-repo slug recipe, shared with SahajCloud `src/fields/slugify.ts`
 * and WeMeditateApp. Change all three together, or an anchor, a region slug and
 * a link written in one place stops resolving in another. An empty result means
 * "no anchor".
 */
export function slugify(value: string): string {
  return String(value ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/['’ʼ`՛՜՞]/g, '') // apostrophes + Armenian in-word marks are dropped, not split on
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}
