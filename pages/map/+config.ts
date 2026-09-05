import type { Config } from 'vike/types'
import LayoutMap from '../../layouts/LayoutMap.js'

/**
 * The atlas uses its own chrome, not LayoutChrome: condensed header, no
 * footer, and no content padding. This lets the map meet the nav edge to
 * edge, and the page never scrolls. See LayoutMap for why each of these
 * follows from the atlas owning the viewport.
 *
 * A no-JS visitor and a crawler still get the nav and the server-rendered
 * region and class content. Only the framing differs.
 */
export default {
  Layout: LayoutMap,
} satisfies Config
