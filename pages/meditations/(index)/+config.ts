import type { Config } from 'vike/types'
import LayoutChrome from '../../../layouts/LayoutChrome.js'
import { ContentHead } from '../../../lib/head.js'

/**
 * The meditations list opts into the site chrome. It lives in the `(index)`
 * route group so that chrome does not cascade onto the sibling
 * `[id]/embed/` route, exactly as `[id]/(full)/` does.
 *
 * It is an indexable URL in every language the site offers, so it declares a
 * canonical and the full `hreflang` cluster `+data.ts` derives.
 */
export default {
  Head: ContentHead,
  Layout: LayoutChrome,
} satisfies Config
