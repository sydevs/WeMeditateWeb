import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { crawlerRefusal } from './crawler-refusal'

export default defineConfig({
  plugins: [tailwindcss(), crawlerRefusal()],
  // Expose PUBLIC__-prefixed environment variables, as in the main app
  envPrefix: 'PUBLIC__',
  resolve: {
    // Force a single React instance. Without this, Ladle's dev pipeline can
    // bind react-use-audio-player's hooks to a separate copy of React. This
    // causes "Invalid hook call" and null-dispatcher errors in the Meditation
    // and Audio player stories.
    dedupe: ['react', 'react-dom'],
    // `@/` is the repo root, as in the app's vite.config.ts.
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('../', import.meta.url)) }],
  },
  optimizeDeps: {
    // Pre-bundle the audio player and its dependency against the deduped
    // React, so the hooks share the renderer's dispatcher.
    include: ['react-use-audio-player', 'howler'],
  },
})
