import type { Config } from 'vike/types'

/**
 * The embed route sets a title but NO Layout — it inherits only the global
 * LayoutRoot and renders bare (no site chrome), ready to embed in an iframe.
 */
export default {
  title: 'Lecture Player',
} satisfies Config
