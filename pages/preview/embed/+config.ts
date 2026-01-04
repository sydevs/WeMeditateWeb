import type { Config } from 'vike/types'
import LayoutEmbed from '../../../layouts/LayoutEmbed.js'

/**
 * Config for embed preview route
 *
 * This route uses LayoutEmbed (minimal passthrough) instead of LayoutDefault.
 * Use this for previewing content that should render without site chrome
 * (Header/Footer).
 *
 * Both /preview and /preview/embed support all collection types.
 * The route determines the layout, not the collection type.
 */
export default {
  Layout: LayoutEmbed,
  title: 'Preview',
} satisfies Config
