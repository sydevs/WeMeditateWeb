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
 *
 * Note: Only runtime bindings are defined here.
 * PUBLIC__* variables are build-time (embedded by Vite from .env.production)
 * and accessed via import.meta.env, not context.env.
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
 * Configuration sources:
 * - apiKey: Cloudflare Workers context (runtime secret) or import.meta.env (dev)
 * - baseURL: import.meta.env (build-time, from .env.production or .env.local)
 * - kv: Cloudflare Workers context bindings (undefined in dev)
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

  // Get baseURL from build-time env (Vite embeds from .env.production or .env.local)
  const baseURL = import.meta.env.PUBLIC__SAHAJCLOUD_URL || 'http://localhost:3000'

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
