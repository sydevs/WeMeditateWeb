import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
  // Expose PUBLIC__-prefixed environment variables, as in the main app
  envPrefix: 'PUBLIC__',
  resolve: {
    // Force a single React instance. Without this, Ladle's dev pipeline can
    // bind react-use-audio-player (AudioPlayerProvider) to a separate copy of
    // React. This causes "Invalid hook call" and null-dispatcher errors in
    // the Meditation and Audio player stories.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Pre-bundle the audio player and its dependency against the deduped
    // React, so the hooks share the renderer's dispatcher.
    include: ['react-use-audio-player', 'howler'],
  },
})
