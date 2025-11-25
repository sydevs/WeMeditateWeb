import type { Config } from 'vike/types'
import LayoutEmbed from '../../../layouts/LayoutEmbed.js'

/**
 * Config for meditation embed route
 * This route is designed for iframe embedding and uses a minimal
 * passthrough layout (LayoutEmbed) instead of the default layout
 * with sidebar/navigation.
 */
export default {
  // Use minimal passthrough layout (no sidebar/navigation)
  Layout: LayoutEmbed,

  // Override page title for embed
  title: 'Meditation Player',
} satisfies Config
