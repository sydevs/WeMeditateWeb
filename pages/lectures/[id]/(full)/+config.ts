import type { Config } from 'vike/types'
import LayoutChrome from '../../../../layouts/LayoutChrome.js'

/**
 * The full lecture page opts into the site chrome (Header/Footer/nav). The
 * sibling `embed/` route sets no Layout and so inherits only the global
 * LayoutRoot — staying bare. Living in the `(full)` route group keeps the chrome
 * from cascading onto `embed/`.
 */
export default {
  Layout: LayoutChrome,
} satisfies Config
