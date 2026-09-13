import type { Config } from 'vike/types'
import LayoutChrome from '../../../../layouts/LayoutChrome.js'
import { ContentHead } from '../../../../lib/head.js'

/**
 * The full lecture page opts into the site chrome (Header/Footer/nav). The
 * sibling `embed/` route sets no Layout, so it inherits only the global
 * LayoutRoot and stays bare. Because this lives in the `(full)` route
 * group, the chrome does not cascade onto `embed/`.
 *
 * It declares a canonical and no `hreflang` cluster: `lectures` carries no
 * `_status` at all upstream, so there is no per-locale publish state to
 * advertise.
 */
export default {
  Head: ContentHead,
  Layout: LayoutChrome,
} satisfies Config
