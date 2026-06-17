import type { Config } from 'vike/types'
import LayoutChrome from '../../layouts/LayoutChrome.js'

/**
 * Content pages (/:slug, including the homepage /index) render with the full
 * site chrome (Header/Footer/nav), nested inside the global LayoutRoot.
 */
export default {
  Layout: LayoutChrome,
} satisfies Config
