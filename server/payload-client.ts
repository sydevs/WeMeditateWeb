/**
 * PayloadCMS REST API client, using @payloadcms/sdk.
 *
 * Important: on Cloudflare Workers, always create a new client instance
 * per request. This keeps I/O context isolation correct.
 */

import { PayloadSDK } from '@payloadcms/sdk'
import { z } from 'zod'
import type { Config } from './payload-types'
import { getCmsContext } from './sahajcloud-context'
import { sahajCloudAuthHeaders, fetchWithErrorDetails } from './sahajcloud-fetch'
import { LIVE_PREVIEW_TOKEN_HEADER } from '../lib/live-preview/protocol'
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
  /** Preview secret for authenticating draft requests (sent as the x-sahajcloud-preview-secret header) */
  previewToken?: string
}

/**
 * Zod schema for PayloadCMS client configuration.
 * Uses shared schemas from validation.ts for consistency.
 */
const payloadConfigSchema = z.object({
  apiKey: apiKeySchema,
  baseURL: baseUrlSchema.optional(),
})

/** Zod issue structure for error reporting */
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
  const previewToken = config.preview ? config.previewToken : undefined

  validatePayloadConfig({ apiKey, baseURL })

  const headers: Record<string, string> = sahajCloudAuthHeaders(apiKey)

  if (previewToken) {
    headers[LIVE_PREVIEW_TOKEN_HEADER] = previewToken
  }

  return new PayloadSDK<Config>({
    baseURL: `${baseURL}/api`,
    fetch: fetchWithErrorDetails,
    baseInit: {
      headers,
    },
  })
}

/** Type-safe helper for PayloadCMS SDK client */
export type PayloadClient = ReturnType<typeof createPayloadClient>
