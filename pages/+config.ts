import type { Config } from 'vike/types'
import vikePhoton from 'vike-photon/config'
import vikeReact from 'vike-react/config'
import Layout from '../layouts/LayoutRoot.js'

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // Global layout applied to every route: loads global CSS + the Sentry error
  // boundary and renders bare. Routes opt into the Header/Footer/nav by ALSO
  // setting `Layout: LayoutChrome` in their own +config.ts (Vike nests the two,
  // since `Layout` is cumulative). Embed routes set nothing → bare by construction.
  // https://vike.dev/Layout
  Layout,

  // Default <head> tags. Content pages override these per-page via usePageHead
  // (lib/head.ts) using their CMS meta; these apply where meta is absent.
  // https://vike.dev/head-tags
  title: 'We Meditate',
  description:
    'Discover free guided meditations, music, and articles to learn and deepen your meditation practice.',

  extends: [vikeReact, vikePhoton],
  port: 5173,

  // https://vike.dev/vike-photon
  photon: {
    server: '../server/entry.ts',
  },
} satisfies Config
