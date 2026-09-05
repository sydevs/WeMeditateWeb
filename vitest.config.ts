import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    // Smoke specs hit a deployed preview over the network. Run them only
    // with `pnpm test:smoke` (vitest.smoke.config.ts). Do not run them here.
    exclude: ['node_modules', 'dist', 'build', '.ladle', 'tests/smoke/**'],
  },
})
