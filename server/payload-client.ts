/**
 * PayloadCMS REST API client, using @payloadcms/sdk.
 *
 * Important: on Cloudflare Workers, always create a new client instance
 * per request. This keeps I/O context isolation correct.
 */

import { PayloadSDK } from '@payloadcms/sdk'
import { z } from 'zod'
import type { Config } from './payload-types'
import { getCmsContext } from './cms-context'
import { apiKeySchema, baseUrlSchema } from './validation'

/**
 * Configuration for creating a PayloadCMS SDK client.
 * Every field is optional. Defaults come from the CMS context or environment.
 */
export interface PayloadClientConfig {
  /** PayloadCMS API key (optional, falls back to context or env). */
  apiKey?: string
  /** Base URL for the PayloadCMS API (optional, falls back to context or env). */
  baseURL?: string
  /** Enable preview mode for draft content requests */
  preview?: boolean
  /** Preview secret for authenticating draft requests (passed via URL parameter) */
  previewSecret?: string
}

const PREVIEW_SECRET_HEADER = 'x-sahajcloud-preview-secret'

/**
 * Zod schema for PayloadCMS client configuration.
 * Uses shared schemas from validation.ts for consistency.
 */
const payloadConfigSchema = z.object({
  apiKey: apiKeySchema,
  baseURL: baseUrlSchema.optional(),
})

/**
 * Zod issue structure for error reporting
 */
interface ValidationIssue {
  path: PropertyKey[]
  message: string
}

/**
 * Error thrown when PayloadCMS configuration is invalid.
 * Has a `response.status` property for compatibility with detectErrorType().
 */
export class PayloadConfigError extends Error {
  public readonly response: { status: number }
  public readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    const message = issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    super(`PayloadCMS configuration error: ${message}`)
    this.name = 'PayloadConfigError'
    this.issues = issues

    // Determine status: missing API key = 401, invalid URL = 400
    const hasApiKeyError = issues.some((i) => i.path.includes('apiKey'))
    this.response = { status: hasApiKeyError ? 401 : 400 }
  }
}

/**
 * Validates PayloadCMS configuration before making API requests.
 * Uses Zod for schema validation with clear error messages.
 *
 * @param config - Configuration to validate (should already have resolved values)
 * @throws PayloadConfigError with Zod issues if configuration is invalid
 */
export function validatePayloadConfig(config: { apiKey?: string; baseURL?: string }): void {
  const result = payloadConfigSchema.safeParse(config)
  if (!result.success) {
    throw new PayloadConfigError(result.error.issues)
  }
}

/**
 * A custom fetch wrapper that logs every CMS request and error body.
 *
 * The SDK throws a `PayloadSDKError` on a non-OK response, carrying the
 * status and the first error message only. This wrapper writes the full
 * response body to the log first, so a 400 says which field it objected
 * to. It also emits the `[PayloadCMS] <method> <url> → <status>` line the
 * debugging workflow in AGENTS.md reads.
 */
async function fetchWithErrorDetails(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init)

  // Log every API request, for debugging.
  console.log(`[PayloadCMS] ${init?.method || 'GET'} ${input} → ${response.status}`)

  // If not OK, log the actual error details before the SDK swallows them.
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
 * Creates a new PayloadCMS SDK client instance. See the file header for
 * why a fresh instance is required per request.
 *
 * @param config - Optional client configuration. Defaults come from the CMS context or environment.
 * @returns Configured PayloadSDK instance
 * @throws PayloadConfigError if configuration is invalid (missing API key, malformed URL)
 */
export function createPayloadClient(config: PayloadClientConfig = {}) {
  const cmsContext = getCmsContext()

  const apiKey = config.apiKey ?? cmsContext.apiKey
  const baseURL = config.baseURL ?? cmsContext.baseURL
  const previewSecret = config.preview ? config.previewSecret : undefined

  validatePayloadConfig({ apiKey, baseURL })

  const headers: Record<string, string> = {
    Authorization: `clients API-Key ${apiKey}`,
  }

  if (previewSecret) {
    headers[PREVIEW_SECRET_HEADER] = previewSecret
  }

  return new PayloadSDK<Config>({
    baseURL: `${baseURL}/api`,
    fetch: fetchWithErrorDetails,
    baseInit: {
      headers,
    },
  })
}

/**
 * Type-safe helper for PayloadCMS SDK client
 */
export type PayloadClient = ReturnType<typeof createPayloadClient>
