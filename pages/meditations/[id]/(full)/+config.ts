import type { Config } from 'vike/types'
import LayoutChrome from '../../../../layouts/LayoutChrome.js'

/**
 * The full meditation page opts into the site chrome (Header/Footer/nav). The
 * sibling `embed/` route sets no Layout and so inherits only the global
 * LayoutRoot — staying bare. Because this lives in the `(full)` route group, the
 * chrome does not cascade onto `embed/`.
 */
export default {
  Layout: LayoutChrome,
} satisfies Config
