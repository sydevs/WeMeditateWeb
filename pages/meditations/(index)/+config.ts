import type { Config } from 'vike/types'
import LayoutChrome from '../../../layouts/LayoutChrome.js'

/**
 * The meditations list opts into the site chrome. It lives in the `(index)`
 * route group so that chrome does not cascade onto the sibling
 * `[id]/embed/` route, exactly as `[id]/(full)/` does.
 *
 * It is an indexable URL in every language the site offers, and its `+data.ts`
 * builds the document the site's one generator renders — a canonical and the
 * full `hreflang` cluster.
 */
export default {
  Layout: LayoutChrome,
} satisfies Config
