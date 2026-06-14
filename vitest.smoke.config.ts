import { defineConfig } from 'vitest/config'

/**
 * Vitest config for smoke specs that hit the deployed Cloudflare preview.
 *
 * Run via `pnpm test:smoke` with PREVIEW_URL set (CI sets it from the discovery
 * script). These specs are deliberately excluded from the default unit-test
 * config (vitest.config.ts) so `pnpm test:run` never hits the network.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/smoke/**/*.smoke.test.ts'],
    // Network round-trips against a real edge deployment — give them room and
    // retry transient failures (matches the reference project's 2 retries in CI).
    testTimeout: 30_000,
    hookTimeout: 30_000,
    retry: 2,
    bail: 0,
  },
})
