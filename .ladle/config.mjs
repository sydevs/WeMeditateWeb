/** @type {import('@ladle/react').UserConfig} */
export default {
  // Story patterns - where Ladle should look for stories
  stories: "components/**/*.stories.{js,jsx,ts,tsx}",

  // Port for Ladle dev server
  port: 61000,

  // Customize the title
  title: "WeMeditate Component Library",

  // Enable hot module replacement
  hmr: true,

  // Base path for production builds (if you ever deploy it)
  base: "/",

  // Use Vite config from the project
  viteConfig: ".ladle/vite.config.ts",

  // Disable the dark-mode toggle — the component library is light-theme only
  addons: {
    theme: {
      enabled: false, // removes the dark/light toggle from the toolbar
      defaultState: "light", // force light theme
    },
  },
};
