import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [
    vike(),
    react(),
    // Sentry only uploads source maps during production builds; skip it on the
    // dev server (`command === 'serve'`) so it doesn't initialize once per Vite
    // environment and slow cold start (see the workerd↔Node RPC warning).
    ...(command === 'build'
      ? [
          sentryVitePlugin({
            sourcemaps: {
              disable: false,
            },
          }),
        ]
      : []),
    tailwindcss(),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  // Make PUBLIC__ prefixed environment variables available
  envPrefix: 'PUBLIC__',
}))
