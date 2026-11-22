import type { Config } from 'vike/types'
import { NoIndexHead } from '@/lib/seo/head.js'

/**
 * The embed route sets a title but no Layout — it inherits only the global
 * LayoutRoot and renders bare (no site chrome), ready to embed in an iframe.
 *
 * It publishes no URL claim — no canonical, no cluster, no JSON-LD — and says
 * `noindex`, because a bare player is not a page to rank against the one it
 * belongs to.
 */
export default {
  Head: NoIndexHead,
  title: 'Meditation Player',
} satisfies Config
