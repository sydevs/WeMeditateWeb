/**
 * Global type extensions for Vike's PageContext.
 * This file extends the default PageContext with Cloudflare Workers bindings
 * and custom properties added by hooks like onBeforeRoute.
 */

import type { Locale } from '../server/cms-types'

declare global {
  namespace Vike {
    interface PageContext {
      /** Current locale (added by onBeforeRoute hook) */
      locale: Locale

      /** Cloudflare Workers runtime context */
      cloudflare?: {
        env?: {
          /** Cloudflare KV namespace for caching API responses */
          WEMEDITATE_CACHE?: KVNamespace
        }
      }
    }
  }
}

export {}
