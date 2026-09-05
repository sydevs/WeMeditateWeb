/**
 * CMS configuration context, using Hono's Context Storage.
 *
 * This module gives request-scoped access to CMS configuration (apiKey,
 * baseURL, kv). A caller does not pass these values explicitly.
 *
 * Usage:
 * - In server/entry.ts, register the contextStorage() middleware.
 * - In CMS client functions, call getCmsContext() to read the config.
 */

import { getContext } from 'hono/context-storage'
import type { Context } from 'hono'
import type { KVNamespace } from '@cloudflare/workers-types'
import { z } from 'zod'
import { apiKeySchema, baseUrlSchema } from './validation'

/**
 * Hono environment type for Cloudflare Workers bindings.
 *
 * This defines only runtime bindings. `PUBLIC__*` variables are
 * build-time: Vite embeds them from `.env.production`, and code reads
 * them through `import.meta.env`, not `context.env`.
 */
export type CmsEnv = {
  Bindings: {
    SAHAJCLOUD_API_KEY?: string
    WEMEDITATE_CACHE?: KVNamespace
  }
}

/**
 * CMS configuration returned by getCmsContext()
 */
export interface CmsContext {
  apiKey: string
  baseURL: string
  kv: KVNamespace | undefined
}

/**
 * Zod schema for validating CMS context configuration.
 * Uses shared schemas from validation.ts for consistency.
 */
const cmsContextSchema = z.object({
  apiKey: apiKeySchema,
  baseURL: baseUrlSchema,
})

/**
 * Gets the Hono context, or returns undefined when none is available.
 * This handles code that runs outside a request context, for example
 * local development without the Workers runtime.
 */
function tryGetContext(): Context<CmsEnv> | undefined {
  try {
    return getContext<CmsEnv>()
  } catch {
    return undefined
  }
}

/**
 * Gets CMS configuration from Hono's context storage.
 * Uses Zod for validation with clear error messages.
 *
 * Configuration sources:
 * - apiKey: Cloudflare Workers context (runtime secret) or import.meta.env (dev)
 * - baseURL: import.meta.env (build-time, from .env.production or .env.local)
 * - kv: Cloudflare Workers context bindings (undefined in dev)
 *
 * @returns CMS configuration with apiKey, baseURL, and optional kv
 * @throws Error if configuration validation fails
 */
export function getCmsContext(): CmsContext {
  const context = tryGetContext()

  const apiKey = context?.env?.SAHAJCLOUD_API_KEY || import.meta.env.SAHAJCLOUD_API_KEY

  const baseURL = import.meta.env.PUBLIC__SAHAJCLOUD_URL || 'http://localhost:3000'

  const result = cmsContextSchema.safeParse({ apiKey, baseURL })

  if (!result.success) {
    const errorMessage = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`CMS context validation failed: ${errorMessage}`)
  }

  const kv = context?.env?.WEMEDITATE_CACHE

  return {
    apiKey: result.data.apiKey,
    baseURL: result.data.baseURL,
    kv,
  }
}

/**
 * Checks whether CMS context is available in the current request.
 * Useful for conditional logic in code that may run outside a request.
 */
export function hasCmsContext(): boolean {
  return tryGetContext() !== undefined
}
