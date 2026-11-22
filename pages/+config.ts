import type { Config } from 'vike/types'
import vikePhoton from 'vike-photon/config'
import vikeReact from 'vike-react/config'
import Layout from '@/layouts/LayoutRoot.js'
// ⚠ The import attribute is load-bearing. Vike reads an import of a plain
// `.ts` file in a `+config.ts` as config code and executes it while it
// resolves the config, where there is no request and no app — evaluating the
// translations snapshot there throws. A `.tsx` import is a pointer import by
// its extension alone, which is why `Layout` needs no attribute.
// See https://vike.dev/config#pointer-imports
import {
  contentDescription,
  contentTitle,
} from '@/lib/seo/head-settings.js' with { type: 'vike:pointer' }
import { seoHeadHtml } from '@/lib/seo/head-html.js' with { type: 'vike:pointer' }

// Default config. Pages can override it.
// https://vike.dev/config

export default {
  // Global layout for every route: loads the global CSS and the Sentry
  // error boundary, and renders bare. A route opts into the Header, Footer,
  // and nav by also setting `Layout: LayoutChrome` in its own +config.ts
  // (Vike nests the two layouts, because `Layout` is cumulative). Embed
  // routes set nothing extra → bare by construction.
  // https://vike.dev/Layout
  Layout,

  // The whole site's <title> and description, in one declaration. Each reads
  // the SEO document the route's +data.ts built (lib/seo/content-seo.ts), and
  // falls back to the site's own name and description, in the locale of the
  // URL, for a route that publishes none — an embed route, or the error page.
  // `og:image` is not a setting here: it rides the route's own Open Graph
  // list, because vike-react's `image` cannot see `pageContext.data`.
  // https://vike.dev/head-tags
  title: contentTitle,
  description: contentDescription,

  // The rest of the head — the canonical, the `hreflang` cluster, Open Graph,
  // Twitter and the `@graph` — generated from the document the route's
  // +data.ts built (lib/seo/head-html.ts).
  // ⚠ Declared here and nowhere else. `headHtmlEnd` is global as well as
  // cumulative, so a second declaration on one route adds a second copy of
  // the whole head to every page of the site, not only to that route's.
  // Building the document is the opt-in: a route that builds none publishes
  // no URL claim at all, which is what keeps the embed routes bare.
  // https://vike.dev/headHtmlEnd
  headHtmlEnd: seoHeadHtml,

  // `translations` is filled by +onBeforeRender from SahajCloud. The client
  // needs it so `useT()` resolves the same strings during hydration as the
  // server rendered. `locale` needs no entry: Vike re-runs +onBeforeRoute in
  // the browser, on hydration and on every client-side navigation.
  // https://vike.dev/passToClient
  // `livePreview` carries the verdict and the scope, never the token: the
  // browser needs to know it is in a preview so the link guard mounts and the
  // unsaved-edit listener subscribes, and it must not learn the credential.
  passToClient: ['translations', 'livePreview'],

  extends: [vikeReact, vikePhoton],
  port: 5173,

  // https://vike.dev/vike-photon
  photon: {
    server: '../server/entry.ts',
  },
} satisfies Config
