import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeReact from "vike-react/config";
import Layout from "../layouts/LayoutDefault.js";

// Default config (can be overridden by pages)
// https://vike.dev/config

export default {
  // https://vike.dev/Layout
  Layout,

  // https://vike.dev/head-tags
  title: "We Meditate Web",
  description: "Demo showcasing Vike",

  extends: [vikeReact, vikePhoton],
  port: 5173,

  // https://vike.dev/vike-photon
  photon: {
    server: "../server/entry.ts",
  },
} satisfies Config;
