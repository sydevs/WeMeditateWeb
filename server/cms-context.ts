/**
 * CMS configuration context using Hono's Context Storage.
 *
 * This module provides request-scoped access to CMS configuration
 * (apiKey, baseURL, kv) without requiring explicit parameter passing.
 *
 * Usage:
 * - In server/entry.ts: Register contextStorage() middleware
 * - In CMS client functions: Call getCmsContext() to access config
 */

import { getContext } from 'hono/context-storage'
import type { Context } from 'hono'
import type { KVNamespace } from '@cloudflare/workers-types'

/**
 * Hono environment type definition for Cloudflare Workers bindings
 */
export type CmsEnv = {
  Bindings: {
    SAHAJCLOUD_API_KEY?: string
    PUBLIC__SAHAJCLOUD_URL?: string
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
 * Attempts to get the Hono context, returning undefined if not available.
 * This handles the case where code runs outside of a request context
 * (e.g., during local development without Workers runtime).
 */
function tryGetContext(): Context<CmsEnv> | undefined {
  try {
    return getContext<CmsEnv>()
  } catch {
    // Context not available (running outside request context)
    return undefined
  }
}

/**
 * Gets CMS configuration from Hono's context storage.
 *
 * This function attempts to retrieve apiKey, baseURL, and kv from:
 * 1. Hono context bindings (Cloudflare Workers runtime - secrets & env vars)
 * 2. import.meta.env fallback (Vite dev server - .env.local)
 *
 * @returns CMS configuration with apiKey, baseURL, and optional kv
 * @throws Error if apiKey is not available from any source
 */
export function getCmsContext(): CmsContext {
  // Try to get context from Hono's AsyncLocalStorage
  const context = tryGetContext()

  // Get apiKey: first from Cloudflare Workers context (secrets), then import.meta.env (dev)
  const apiKey =
    context?.env?.SAHAJCLOUD_API_KEY || import.meta.env.SAHAJCLOUD_API_KEY

  if (!apiKey) {
    throw new Error(
      'CMS API key not available. Ensure SAHAJCLOUD_API_KEY is set in environment.'
    )
  }

  // Get baseURL: first from Cloudflare Workers context, then import.meta.env, then default
  const baseURL =
    context?.env?.PUBLIC__SAHAJCLOUD_URL ||
    import.meta.env.PUBLIC__SAHAJCLOUD_URL ||
    'http://localhost:3000'

  // Get KV from context bindings (undefined in dev or when context unavailable)
  const kv = context?.env?.WEMEDITATE_CACHE

  return { apiKey, baseURL, kv }
}

/**
 * Checks if CMS context is currently available within a request.
 * Useful for conditional logic in code paths that may run outside request context.
 */
export function hasCmsContext(): boolean {
  return tryGetContext() !== undefined
}
