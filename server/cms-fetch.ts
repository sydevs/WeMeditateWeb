/**
 * The one fetch for CMS endpoints the Payload SDK cannot express.
 *
 * The SDK covers collection reads. Custom root endpoints — `/api/atlas/seo`,
 * the `related-*` feeds, a content-index block's computed endpoint — belong to
 * no collection, so each read hand-rolled the same preamble and the copies
 * drifted: one lost its request log, and a status-less throw cost a
 * Cloudflare-origin 5xx its retry (#127).
 *
 * This module owns the preamble only. A caller keeps its own retry wrapper and
 * its own non-OK policy, because those genuinely differ per read.
 *
 * It sits outside `payload-client.ts` for two mechanical reasons:
 * `cms-client.test.ts` and `atlas-client.test.ts` replace that module
 * wholesale, so anything exported from it is `undefined` under test; and
 * `content-index.ts` pulls in no SDK, and should not start.
 */

import { getCmsContext } from './cms-context'

/** Request options for {@link cmsFetch}. Authorization is not a caller's to set. */
export type CmsFetchInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

/**
 * A non-OK CMS response, as an error carrying its status.
 *
 * The status rides on the error because `detectErrorType` reads it
 * structurally and otherwise falls back to matching `50[0-9]` in the message.
 * A plain `Error` therefore classifies a Cloudflare-origin 520, 522 or 524 as
 * UNKNOWN, and `withRetry` refuses it — exactly the shape a Railway restart
 * behind the edge produces.
 */
export class CmsResponseError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'CmsResponseError'
    this.status = status
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
export async function fetchWithErrorDetails(
  input: RequestInfo | URL,
  init?: RequestInit,
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
 * Reads a CMS endpoint the SDK cannot express.
 *
 * Takes a path, not a URL. Resolving the base URL here is what removes
 * `getCmsContext()` from every call site; handed a URL, each site would still
 * have to build one.
 *
 * @param path - Path and query from the leading slash, e.g. `/api/atlas/seo?route=…`
 */
export function cmsFetch(path: string, init: CmsFetchInit = {}): Promise<Response> {
  const { apiKey, baseURL } = getCmsContext()

  return fetchWithErrorDetails(`${baseURL}${path}`, {
    ...init,
    headers: { Authorization: `clients API-Key ${apiKey}`, ...init.headers },
  })
}
