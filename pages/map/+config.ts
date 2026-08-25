import type { Config } from 'vike/types'
import LayoutChrome from '../../layouts/LayoutChrome.js'

/**
 * The atlas pages carry the site chrome, so a no-JS visitor — and a crawler —
 * gets the surrounding navigation with the content.
 *
 * The widget covers it once it mounts: in its default map mode the canvas is
 * `position: fixed; inset: 0`, which is what the atlas wants on a page of its
 * own. That is the intended split rather than a conflict — the chrome is the
 * page's fallback state, the widget is its upgraded one.
 */
export default {
  Layout: LayoutChrome,
} satisfies Config
