import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss()],
  // Make PUBLIC__ prefixed environment variables available (same as main app)
  envPrefix: 'PUBLIC__',
  resolve: {
    // Force a single React instance. Without this, Ladle's dev pipeline can
    // bind react-use-audio-player (AudioPlayerProvider) to a separate copy of
    // React, producing "Invalid hook call" / null-dispatcher errors in the
    // Meditation/Audio player stories.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Pre-bundle the audio player and its dep against the deduped React so the
    // hooks share the renderer's dispatcher.
    include: ['react-use-audio-player', 'howler'],
  },
})
