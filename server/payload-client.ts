/**
 * PayloadCMS REST API client using @payloadcms/sdk.
 *
 * IMPORTANT: Always create a new client instance per request when using
 * Cloudflare Workers. This ensures proper I/O context isolation.
 *
 * Known SDK Issue: @payloadcms/sdk returns `undefined` on error instead of
 * throwing (GitHub issue #14495). All query functions must handle this.
 */

import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from './payload-types'

/**
 * Configuration for creating a PayloadCMS SDK client
 */
export interface PayloadClientConfig {
  /** PayloadCMS API key for authentication */
  apiKey: string
  /** Base URL for the PayloadCMS API (without /api suffix) */
  baseURL?: string
}

/**
 * Creates a new PayloadCMS SDK client instance.
 *
 * IMPORTANT: Always create a new client instance per request when using
 * Cloudflare Workers to ensure proper I/O context isolation.
 *
 * @param config - Client configuration with API key and optional base URL
 * @returns Configured PayloadSDK instance
 */
export function createPayloadClient(config: PayloadClientConfig) {
  const baseURL =
    config.baseURL ||
    import.meta.env.PUBLIC__SAHAJCLOUD_URL ||
    'http://localhost:3000'

  return new PayloadSDK<Config>({
    baseURL: `${baseURL}/api`,
    baseInit: {
      headers: {
        Authorization: `clients API-Key ${config.apiKey}`,
      },
    },
  })
}

/**
 * Type-safe helper for PayloadCMS SDK client
 */
export type PayloadClient = ReturnType<typeof createPayloadClient>

/**
 * Validates SDK response and throws if undefined/null.
 *
 * The PayloadCMS SDK has a known bug where it returns undefined on error
 * instead of throwing (GitHub issue #14495). This wrapper ensures errors
 * are properly thrown for retry logic to work correctly.
 *
 * @param result - The result from an SDK call
 * @param context - Description of the operation for error messages
 * @throws Error if result is undefined or null
 * @returns The validated result
 */
export function validateSDKResponse<T>(
  result: T | undefined | null,
  context: string
): T {
  if (result === undefined || result === null) {
    throw new Error(`PayloadCMS SDK returned undefined: ${context}`)
  }
  return result
}
