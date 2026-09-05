import type { Config } from 'vike/types'

/**
 * The embed route sets a title but no Layout — it inherits only the global
 * LayoutRoot and renders bare (no site chrome), ready to embed in an iframe.
 */
export default {
  title: 'Meditation Player',
} satisfies Config
