import type { Config } from 'vike/types'
import LayoutChrome from '../../../../layouts/LayoutChrome.js'
import { ContentHead } from '../../../../lib/head.js'

/**
 * The full meditation page opts into the site chrome (Header/Footer/nav). The
 * sibling `embed/` route sets no Layout and so inherits only the global
 * LayoutRoot — staying bare. Because this lives in the `(full)` route group, the
 * chrome does not cascade onto `embed/`.
 *
 * It declares a canonical and no `hreflang` cluster: `meditations` carries
 * no per-locale publish state upstream, so there is no claim that a
 * translation of this URL exists.
 */
export default {
  Head: ContentHead,
  Layout: LayoutChrome,
} satisfies Config
