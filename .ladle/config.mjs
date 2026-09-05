/** @type {import('@ladle/react').UserConfig} */
export default {
  // Story patterns: where Ladle finds stories
  stories: "components/**/*.stories.{js,jsx,ts,tsx}",

  // Port for Ladle dev server
  port: 61000,

  // Customize the title
  title: "WeMeditate Component Library",

  // Enable hot module replacement
  hmr: true,

  // Base path for a production build, if you deploy one
  base: "/",

  // Use the project's Vite config
  viteConfig: ".ladle/vite.config.ts",

  // Disable the dark-mode toggle — the component library is light-theme only
  addons: {
    theme: {
      enabled: false, // removes the dark/light toggle from the toolbar
      defaultState: "light", // forces light theme
    },
  },
};
