import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // `@/` is the repo root, as in vite.config.ts.
  resolve: {
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./', import.meta.url)) }],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    // Smoke specs hit a deployed preview over the network. Run them only
    // with `pnpm test:smoke` (vitest.smoke.config.ts). Do not run them here.
    // The pattern excludes the network specs by name, not the whole folder,
    // so a pure unit test of a smoke *helper* still runs in this lane.
    exclude: ['node_modules', 'dist', 'build', '.ladle', 'tests/smoke/**/*.smoke.test.ts'],
  },
})
