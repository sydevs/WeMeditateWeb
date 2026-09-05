import { defineConfig } from 'vitest/config'

/**
 * Vitest config for smoke specs against the deployed Cloudflare preview.
 *
 * Run with `pnpm test:smoke`. Set PREVIEW_URL first (CI sets it from the
 * discovery script). vitest.config.ts excludes these specs, so
 * `pnpm test:run` never reaches the network.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/smoke/**/*.smoke.test.ts'],
    // These specs make real network calls to a live edge deployment.
    // Allow more time and retry transient failures (2 retries, as in CI).
    testTimeout: 30_000,
    hookTimeout: 30_000,
    retry: 2,
    bail: 0,
  },
})
