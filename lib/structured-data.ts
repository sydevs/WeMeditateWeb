/**
 * The one duration format schema.org takes.
 *
 * The nodes themselves are not built here: a route describes its `@graph` as
 * plain data (`lib/seo-schema.ts`) and Unhead renders it
 * (`lib/seo-head-html.ts`). What is left is the one conversion that has no
 * owner there.
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
