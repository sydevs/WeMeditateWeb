import type { Config } from 'vike/types'
import LayoutMap from '../../layouts/LayoutMap.js'

/**
 * The atlas uses its own chrome rather than LayoutChrome: condensed header, no
 * footer, and no content padding, so the map meets the nav edge to edge and the
 * page never scrolls. See LayoutMap for why each of those follows from the atlas
 * owning the viewport.
 *
 * A no-JS visitor and a crawler still get the nav and the server-rendered
 * region/class content; only the framing differs.
 */
export default {
  Layout: LayoutMap,
} satisfies Config
