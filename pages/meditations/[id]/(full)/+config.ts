import type { Config } from 'vike/types'
import LayoutChrome from '../../../../layouts/LayoutChrome.js'
// ⚠ The import attribute is load-bearing. Vike reads an import of a plain
// `.ts` file in a `+config.ts` as config code and executes it while it
// resolves the config, where there is no request and no app. A `.tsx` import
// is a pointer import by its extension alone, which is why `LayoutChrome`
// needs no attribute. See https://vike.dev/config#pointer-imports
import { seoHeadHtml } from '../../../../lib/seo-head-html.js' with { type: 'vike:pointer' }

/**
 * The full meditation page opts into the site chrome (Header/Footer/nav). The
 * sibling `embed/` route sets no Layout and so inherits only the global
 * LayoutRoot — staying bare. Because this lives in the `(full)` route group, the
 * chrome does not cascade onto `embed/`.
 *
 * It declares a canonical and no `hreflang` cluster: `meditations` carries
 * no per-locale publish state upstream, so there is no claim that a
 * translation of this URL exists.
 */
export default {
  Layout: LayoutChrome,
  headHtmlEnd: seoHeadHtml,
} satisfies Config
