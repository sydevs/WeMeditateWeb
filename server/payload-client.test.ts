/** Tests for PayloadCMS REST API client utilities */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { PayloadSDKError } from '@payloadcms/sdk'
import { createPayloadClient } from './payload-client'
import { detectErrorType, ErrorType } from './error-utils'

// createPayloadClient reads its defaults from the request context, which does
// not exist under Vitest. Shape checked against server/sahajcloud-context.ts.
vi.mock('./sahajcloud-context', () => ({
  getSahajCloudContext: () => ({
    apiKey: 'test-key',
    baseURL: 'https://sahajcloud.test',
    kv: undefined,
  }),
}))

/**
 * Pins the upstream contract this client depends on: @payloadcms/sdk throws on
 * a non-OK response instead of resolving `undefined`. The repo carried a
 * `validateSDKResponse` guard for the era when it did not (payload#14495).
 */
describe('a non-OK SahajCloud response', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /** Stubs global fetch with one non-OK JSON response, and silences the client's logging. */
  function stubSahajCloudResponse(status: number, body: unknown) {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )
  }

  it('rejects with a PayloadSDKError instead of resolving undefined', async () => {
    stubSahajCloudResponse(400, { errors: [{ message: 'The following field is invalid: select' }] })

    const client = createPayloadClient()
    const read = client.findGlobal({ slug: 'wm-web-config' })

    await expect(read).rejects.toBeInstanceOf(PayloadSDKError)
    await expect(read).rejects.toThrow('The following field is invalid: select')
  })

  it('carries the HTTP status, so error-utils classifies it', async () => {
    stubSahajCloudResponse(503, { errors: [{ message: 'Service Unavailable' }] })

    const client = createPayloadClient()
    const error = await client.findGlobal({ slug: 'wm-web-config' }).catch((e: unknown) => e)

    expect((error as PayloadSDKError).status).toBe(503)
    expect(detectErrorType(error)).toBe(ErrorType.SERVER)
  })
})
