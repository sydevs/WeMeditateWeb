import type { Config } from 'vike/types'
import LayoutChrome from '../../layouts/LayoutChrome.js'
import { ContentHead } from '../../lib/head.js'

/**
 * Content pages (/:slug, including the homepage /index) render with the full
 * site chrome (Header/Footer/nav), nested inside the global LayoutRoot.
 *
 * They are also indexable URLs, so they declare a canonical and the
 * `hreflang` cluster of the locales `+data.ts` says the page is published
 * in. The live-preview route renders the same template and declares
 * neither: a draft preview is not a URL to point a crawler at.
 */
export default {
  Head: ContentHead,
  Layout: LayoutChrome,
} satisfies Config
