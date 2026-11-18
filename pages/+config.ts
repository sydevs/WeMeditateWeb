import type { Config } from 'vike/types'
import vikePhoton from 'vike-photon/config'
import vikeReact from 'vike-react/config'
import Layout from '../layouts/LayoutRoot.js'
import { contentDescription, contentTitle } from '../lib/head.js'

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
  // the SEO document the route's +data.ts built (lib/content-seo.ts), and
  // falls back to the site's own name and description, in the locale of the
  // URL, for a route that publishes none — an embed route, or the error page.
  // `og:image` is not a setting here: it rides the route's own Open Graph
  // list, because vike-react's `image` cannot see `pageContext.data`.
  // https://vike.dev/head-tags
  title: contentTitle,
  description: contentDescription,

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
