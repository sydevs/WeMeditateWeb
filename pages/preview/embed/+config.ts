import type { Config } from 'vike/types'

/**
 * Config for the embed preview route (/preview/embed).
 *
 * It sets no Layout, so it inherits only the global LayoutRoot and previews
 * content bare (no Header/Footer) — for checking how an embed will look. The
 * sibling `(full)` route adds LayoutChrome for the chromed /preview.
 *
 * Both /preview and /preview/embed support all collection types; the route
 * (not the collection) decides the layout. /preview/embed is loaded by the
 * SahajCloud live-preview iframe — do not rename it.
 */
export default {
  title: 'Preview',
} satisfies Config
