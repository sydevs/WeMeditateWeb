/**
 * The server's Sentry options. Photon and the SDK are stubbed, so this reads
 * only what `entry.ts` hands `withSentry`.
 */

import { describe, it, expect, vi } from 'vitest'
import type { CloudflareOptions, ErrorEvent, Event } from '@sentry/cloudflare'

const { withSentry } = vi.hoisted(() => ({ withSentry: vi.fn() }))

vi.mock('@photonjs/hono', () => ({ apply: () => {}, serve: () => ({}) }))
vi.mock('@sentry/cloudflare', () => ({ withSentry }))

await import('./entry')

/** The options `entry.ts` hands `withSentry`, for the given Worker env. */
function serverOptions(): CloudflareOptions {
  return withSentry.mock.calls[0][0]({
    SENTRY_DSN: 'https://k@sentry.test/1',
  }) as CloudflareOptions
}

/**
 * An event shaped the way the SDK builds one: the token in the URL and the
 * query string, every inbound header verbatim, and the POST body attached.
 */
function eventWithCredentials(): ErrorEvent {
  return {
    type: undefined,
    request: {
      url: 'https://wemeditate.com/about?live-preview=tok123&scope=pages',
      query_string: 'live-preview=tok123&scope=pages',
      headers: {
        'x-sahajcloud-preview-secret': 'tok123',
        'x-turnstile-token': 'captcha456',
        authorization: 'clients API-Key apikey789',
        'user-agent': 'Mozilla/5.0',
      },
      data: { senderEmail: 'visitor@example.com', submissionData: [{ field: 'name', value: 'Ada' }] },
    },
  } as ErrorEvent
}

describe('server Sentry', () => {
  it('reads the DSN from the Worker env and keeps the live-preview token out of an event', () => {
    const options = serverOptions()
    const event = options.beforeSend?.(eventWithCredentials(), {}) as ErrorEvent

    expect(options.dsn).toBe('https://k@sentry.test/1')
    expect(event.request?.url).toBe('https://wemeditate.com/about?scope=pages')
    expect(JSON.stringify(event)).not.toContain('tok123')
  })

  it('filters every credential header, which Sentry attaches verbatim', () => {
    // `requestDataIntegration` copies the inbound headers onto the event and
    // strips only `cookie` and the IP headers, so these three arrive in full.
    const event = serverOptions().beforeSend?.(eventWithCredentials(), {}) as ErrorEvent
    const headers = event.request?.headers

    expect(headers?.['x-sahajcloud-preview-secret']).toBe('[Filtered]')
    expect(headers?.['x-turnstile-token']).toBe('[Filtered]')
    expect(headers?.authorization).toBe('[Filtered]')
    // A header that is not a credential still reaches Sentry — the point is to
    // keep the event useful.
    expect(headers?.['user-agent']).toBe('Mozilla/5.0')
    expect(JSON.stringify(event)).not.toContain('captcha456')
    expect(JSON.stringify(event)).not.toContain('apikey789')
  })

  it('scrubs a transaction too, which `beforeSend` never sees', () => {
    // `tracesSampleRate` comes from `SENTRY_TRACES_SAMPLE_RATE` in the Worker
    // env, so tracing can be enabled from the Cloudflare dashboard alone.
    const options = serverOptions()
    const transaction = { ...eventWithCredentials(), type: 'transaction' } as Event
    const event = options.beforeSendTransaction?.(transaction as never, {}) as Event

    expect(event.request?.url).toBe('https://wemeditate.com/about?scope=pages')
    expect(JSON.stringify(event)).not.toContain('tok123')
    expect(JSON.stringify(event)).not.toContain('captcha456')
  })
})
