import type { Config } from 'vike/types'
import LayoutChrome from '../../../layouts/LayoutChrome.js'

/**
 * The full live-preview route (/preview) opts into the site chrome
 * (Header/Footer/nav). The sibling `embed/` route sets no Layout and
 * inherits only the global LayoutRoot, so it previews content bare.
 * Because this lives in the `(full)` route group, the chrome does not
 * cascade onto `embed/`.
 *
 * /preview is the URL the SahajCloud live-preview iframe loads — do not rename it.
 */
export default {
  Layout: LayoutChrome,
} satisfies Config
