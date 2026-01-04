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
import { getCmsContext } from './cms-context'

/**
 * Configuration for creating a PayloadCMS SDK client.
 * All fields are optional - defaults come from CMS context/environment.
 */
export interface PayloadClientConfig {
  /** PayloadCMS API key (optional - falls back to context/env) */
  apiKey?: string
  /** Base URL for the PayloadCMS API (optional - falls back to context/env) */
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
 * @param config - Configuration to validate (should already have resolved values)
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
  if (config.baseURL) {
    try {
      new URL(config.baseURL)
    } catch {
      throw new PayloadConfigError(
        `Invalid PayloadCMS URL: "${config.baseURL}". URL must include protocol (e.g., https://cms.example.com).`,
        400
      )
    }
  }
}

/**
 * Custom fetch wrapper that captures HTTP error details.
 *
 * The PayloadCMS SDK's findByID method swallows HTTP status codes and response
 * bodies, replacing them with a generic error message. This wrapper logs the
 * actual error details before the SDK discards them.
 *
 * @see https://github.com/payloadcms/payload/issues/14495
 */
async function fetchWithErrorDetails(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init)

  // Log all API requests for debugging
  console.log(`[PayloadCMS] ${init?.method || 'GET'} ${input} → ${response.status}`)

  // If not OK, log the actual error details before SDK swallows them
  if (!response.ok) {
    const clonedResponse = response.clone()
    try {
      const errorBody = await clonedResponse.json()
      console.error(`[PayloadCMS] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        url: input.toString(),
        body: errorBody,
      })
    } catch {
      console.error(`[PayloadCMS] Error response (non-JSON):`, {
        status: response.status,
        statusText: response.statusText,
        url: input.toString(),
      })
    }
  }

  return response
}

/**
 * Creates a new PayloadCMS SDK client instance.
 *
 * IMPORTANT: Always create a new client instance per request when using
 * Cloudflare Workers to ensure proper I/O context isolation.
 *
 * @param config - Optional client configuration. Defaults come from CMS context/environment.
 * @returns Configured PayloadSDK instance
 * @throws PayloadConfigError if configuration is invalid (missing API key, malformed URL)
 */
export function createPayloadClient(config: PayloadClientConfig = {}) {
  // Get defaults from CMS context if not provided in config
  const cmsContext = getCmsContext()

  const apiKey = config.apiKey ?? cmsContext.apiKey
  const baseURL = config.baseURL ?? cmsContext.baseURL

  // Validate configuration before creating client
  // This provides clear error messages for common misconfiguration issues
  validatePayloadConfig({ apiKey, baseURL })

  return new PayloadSDK<Config>({
    baseURL: `${baseURL}/api`,
    fetch: fetchWithErrorDetails,
    baseInit: {
      headers: {
        Authorization: `clients API-Key ${apiKey}`,
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
