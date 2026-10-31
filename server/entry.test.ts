/**
 * The server's Sentry options. Photon and the SDK are stubbed, so this reads
 * only what `entry.ts` hands `withSentry`.
 */

import { describe, it, expect, vi } from 'vitest'
import type { CloudflareOptions, ErrorEvent } from '@sentry/cloudflare'

const { withSentry } = vi.hoisted(() => ({ withSentry: vi.fn() }))

vi.mock('@photonjs/hono', () => ({ apply: () => {}, serve: () => ({}) }))
vi.mock('@sentry/cloudflare', () => ({ withSentry }))

await import('./entry')

describe('server Sentry', () => {
  it('reads the DSN from the Worker env and keeps the live-preview token out of an event', () => {
    const options = withSentry.mock.calls[0][0]({
      SENTRY_DSN: 'https://k@sentry.test/1',
    }) as CloudflareOptions
    const event = options.beforeSend?.(
      {
        type: undefined,
        request: {
          url: 'https://wemeditate.com/about?live-preview=tok123&scope=pages',
          query_string: 'live-preview=tok123&scope=pages',
        },
      } as ErrorEvent,
      {},
    ) as ErrorEvent

    expect(options.dsn).toBe('https://k@sentry.test/1')
    expect(event.request?.url).toBe('https://wemeditate.com/about?scope=pages')
    expect(JSON.stringify(event)).not.toContain('tok123')
  })
})
