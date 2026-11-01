/**
 * PayloadCMS REST API client, using @payloadcms/sdk.
 *
 * Important: on Cloudflare Workers, always create a new client instance
 * per request. This keeps I/O context isolation correct.
 */

import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from './payload-types'
import { getSahajCloudContext } from './sahajcloud-context'
import { sahajCloudAuthHeaders, fetchWithErrorDetails } from './sahajcloud-fetch'
import { LIVE_PREVIEW_TOKEN_HEADER } from '../lib/live-preview/protocol'

/** Configuration for creating a PayloadCMS SDK client. */
export interface PayloadClientConfig {
  /** Enable preview mode for draft content requests */
  preview?: boolean
  /** Preview secret for authenticating draft requests (sent as the x-sahajcloud-preview-secret header) */
  previewToken?: string
}

/**
 * Creates a new PayloadCMS SDK client instance. See the file header for
 * why a fresh instance is required per request.
 *
 * @param config - Optional preview configuration. The API key and base URL
 * come from the SahajCloud context, which validates them.
 * @returns Configured PayloadSDK instance
 */
export function createPayloadClient(config: PayloadClientConfig = {}) {
  const { apiKey, baseURL } = getSahajCloudContext()
  const previewToken = config.preview ? config.previewToken : undefined

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
