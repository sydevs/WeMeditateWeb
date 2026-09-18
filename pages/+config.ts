import type { Config } from 'vike/types'
import vikePhoton from 'vike-photon/config'
import vikeReact from 'vike-react/config'
import Layout from '../layouts/LayoutRoot.js'

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

  // Default <head> tags. Content pages override these per page with
  // usePageHead (lib/head.tsx), using their CMS meta. These defaults apply
  // only where meta is absent.
  // https://vike.dev/head-tags
  title: 'We Meditate',
  description:
    'Discover free guided meditations, music, and articles to learn and deepen your meditation practice.',

  // `translations` is filled by +onBeforeRender from the CMS. The client
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
