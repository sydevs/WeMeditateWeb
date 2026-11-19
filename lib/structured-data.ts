/**
 * Serializing a JSON-LD block, and the one duration format schema.org takes.
 *
 * The nodes themselves are no longer built here: a content route describes
 * its `@graph` as plain data (`lib/seo-schema.ts`) and Unhead renders it
 * (`lib/seo-head-html.ts`). What is left is what has no owner there — the
 * escaping rule below, which `/map` still needs for the pre-serialized answer
 * SahajCloud sends, and the seconds-to-ISO conversion.
 */

/**
 * An ISO 8601 duration, as schema.org's `duration` expects.
 *
 * Whole minutes render as `PT20M` rather than `PT1200S`: both are valid, and
 * the first is what a meditation's own `durationMinutes` means.
 */
export function isoDuration(seconds: number): string | null {
  const total = Math.round(seconds)

  if (!Number.isFinite(total) || total <= 0) {
    return null
  }

  const parts = [
    [Math.floor(total / 3600), 'H'],
    [Math.floor((total % 3600) / 60), 'M'],
    [total % 60, 'S'],
  ] as const

  return `PT${parts
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value}${unit}`)
    .join('')}`
}

/**
 * One `<script type="application/ld+json">` body: every node under a single
 * `@context`.
 *
 * ⚠ **`<` is escaped to `<`.** The sink is a `<script>` block carrying
 * SahajCloud-authored text, where a literal `</script>` inside a string would
 * close the block and turn the rest of the document into markup. JSON's
 * `\u` escape round-trips to the same character, so a parser reads the
 * original text and `isSafeJsonLd` (lib/head.tsx) finds nothing to refuse.
 *
 * Returns the empty string for no nodes, which is what suppresses the tag.
 */
export function serializeJsonLd(nodes: readonly object[]): string {
  if (nodes.length === 0) {
    return ''
  }

  const document = { '@context': 'https://schema.org', '@graph': nodes }

  return JSON.stringify(document).replace(/</g, '\\u003c')
}
