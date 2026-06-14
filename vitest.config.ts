import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    // Smoke specs hit a deployed preview over the network — run them only via
    // `pnpm test:smoke` (vitest.smoke.config.ts), never in the unit-test run.
    exclude: ['node_modules', 'dist', 'build', '.ladle', 'tests/smoke/**'],
  },
})
