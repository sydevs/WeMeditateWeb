/**
 * Tests for PayloadCMS REST API client utilities
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { PayloadSDKError } from '@payloadcms/sdk'
import { createPayloadClient, validatePayloadConfig, PayloadConfigError } from './payload-client'
import { detectErrorType, ErrorType } from './error-utils'

// createPayloadClient reads its defaults from the request context, which does
// not exist under Vitest. Shape checked against server/cms-context.ts.
vi.mock('./cms-context', () => ({
  getCmsContext: () => ({ apiKey: 'test-key', baseURL: 'https://cms.test', kv: undefined }),
}))

/**
 * Pins the upstream contract this client depends on: @payloadcms/sdk throws on
 * a non-OK response instead of resolving `undefined`. The repo carried a
 * `validateSDKResponse` guard for the era when it did not (payload#14495).
 */
describe('a non-OK CMS response', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /** Stubs global fetch with one non-OK JSON response, and silences the client's logging. */
  function stubCmsResponse(status: number, body: unknown) {
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
    stubCmsResponse(400, { errors: [{ message: 'The following field is invalid: select' }] })

    const client = createPayloadClient()
    const read = client.findGlobal({ slug: 'wm-web-config' })

    await expect(read).rejects.toBeInstanceOf(PayloadSDKError)
    await expect(read).rejects.toThrow('The following field is invalid: select')
  })

  it('carries the HTTP status, so error-utils classifies it', async () => {
    stubCmsResponse(503, { errors: [{ message: 'Service Unavailable' }] })

    const client = createPayloadClient()
    const error = await client.findGlobal({ slug: 'wm-web-config' }).catch((e: unknown) => e)

    expect((error as PayloadSDKError).status).toBe(503)
    expect(detectErrorType(error)).toBe(ErrorType.SERVER)
  })
})

describe('validatePayloadConfig', () => {
  it('should throw with 401 status when API key is missing', () => {
    try {
      validatePayloadConfig({ apiKey: undefined })
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(PayloadConfigError)
      expect((error as PayloadConfigError).response.status).toBe(401)
      expect((error as Error).message).toContain('apiKey')
    }
  })

  it('should throw with 401 status when API key is empty string', () => {
    try {
      validatePayloadConfig({ apiKey: '' })
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(PayloadConfigError)
      expect((error as PayloadConfigError).response.status).toBe(401)
      expect((error as Error).message).toContain('apiKey')
    }
  })

  it('should throw with 401 status when API key is whitespace only', () => {
    try {
      validatePayloadConfig({ apiKey: '   ' })
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(PayloadConfigError)
      expect((error as PayloadConfigError).response.status).toBe(401)
      expect((error as Error).message).toContain('apiKey')
    }
  })

  it('should throw with 400 status for invalid URL format', () => {
    try {
      validatePayloadConfig({ apiKey: 'valid-key', baseURL: 'cms.example.com' })
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(PayloadConfigError)
      expect((error as PayloadConfigError).response.status).toBe(400)
      expect((error as Error).message).toContain('Base URL must be a valid URL')
    }
  })

  it('should accept valid configuration', () => {
    expect(() => validatePayloadConfig({
      apiKey: 'valid-key',
      baseURL: 'https://cms.example.com'
    })).not.toThrow()
  })
})
