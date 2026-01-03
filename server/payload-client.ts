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
 * Error thrown when PayloadCMS configuration is invalid.
 * Has a `response.status` property for compatibility with detectErrorType().
 */
export class PayloadConfigError extends Error {
  public readonly response: { status: number }

  constructor(message: string, status: number = 400) {
    super(message)
    this.name = 'PayloadConfigError'
    this.response = { status }
  }
}

/**
 * Validates PayloadCMS configuration before making API requests.
 * Provides clear error messages for common configuration issues.
 *
 * @param config - Configuration to validate
 * @throws PayloadConfigError with descriptive message if configuration is invalid
 */
export function validatePayloadConfig(config: {
  apiKey?: string
  baseURL?: string
}): void {
  // Check API key is provided and not empty
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new PayloadConfigError(
      'PayloadCMS API key is not configured. Set the SAHAJCLOUD_API_KEY environment variable.',
      401
    )
  }

  // Validate URL format if provided
  const baseURL = config.baseURL || import.meta.env.PUBLIC__SAHAJCLOUD_URL
  if (baseURL) {
    try {
      new URL(baseURL)
    } catch {
      throw new PayloadConfigError(
        `Invalid PayloadCMS URL: "${baseURL}". URL must include protocol (e.g., https://cms.example.com).`,
        400
      )
    }
  }
}

/**
 * Creates a new PayloadCMS SDK client instance.
 *
 * IMPORTANT: Always create a new client instance per request when using
 * Cloudflare Workers to ensure proper I/O context isolation.
 *
 * @param config - Client configuration with API key and optional base URL
 * @returns Configured PayloadSDK instance
 * @throws PayloadConfigError if configuration is invalid (missing API key, malformed URL)
 */
export function createPayloadClient(config: PayloadClientConfig) {
  // Validate configuration before creating client
  // This provides clear error messages for common misconfiguration issues
  validatePayloadConfig(config)

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
