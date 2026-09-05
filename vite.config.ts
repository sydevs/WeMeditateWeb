import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import react from '@vitejs/plugin-react'
import vike from 'vike/plugin'
import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  plugins: [
    vike(),
    react(),
    // Sentry uploads source maps only for production builds. Skip it in the
    // dev server (`command === 'serve'`). This avoids one Sentry init per
    // Vite environment and a slower cold start (see the workerd-Node RPC warning).
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
  // Expose PUBLIC__-prefixed environment variables to the browser build.
  envPrefix: 'PUBLIC__',
}))
