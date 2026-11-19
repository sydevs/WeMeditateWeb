import type { Config } from 'vike/types'
import LayoutChrome from '../../layouts/LayoutChrome.js'
// ⚠ The import attribute is load-bearing. Vike reads an import of a plain
// `.ts` file in a `+config.ts` as config code and executes it while it
// resolves the config, where there is no request and no app. A `.tsx` import
// is a pointer import by its extension alone, which is why `LayoutChrome`
// needs no attribute. See https://vike.dev/config#pointer-imports
import { seoHeadHtml } from '../../lib/seo-head-html.js' with { type: 'vike:pointer' }

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
  Layout: LayoutChrome,
  headHtmlEnd: seoHeadHtml,
} satisfies Config
