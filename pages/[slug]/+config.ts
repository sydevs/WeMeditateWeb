import type { Config } from 'vike/types'
import LayoutChrome from '@/layouts/LayoutChrome.js'

/**
 * Content pages (/:slug, including the homepage /index) render with the full
 * site chrome (Header/Footer/nav), nested inside the global LayoutRoot.
 *
 * They are also indexable URLs, so their `+data.ts` builds the document the
 * site's one generator renders: a canonical and the `hreflang` cluster of the
 * locales the page is published in. The live-preview route builds the same
 * document and the generator drops it — a draft is not a URL to point a
 * crawler at.
 */
export default {
  Layout: LayoutChrome,
} satisfies Config
