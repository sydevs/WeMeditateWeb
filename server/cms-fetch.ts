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
 * It sits outside `payload-client.ts` because `cms-client.test.ts` and
 * `atlas-client.test.ts` replace that module wholesale, so anything exported
 * from it is `undefined` in both suites.
 */

import { getCmsContext } from './cms-context'

/**
 * A non-OK CMS response, as an error carrying its status.
 *
 * The status rides on the error because `detectErrorType` reads it
 * structurally and otherwise falls back to matching `50[0-9]` in the message.
 * A plain `Error` therefore classifies a Cloudflare-origin 520, 522 or 524 as
 * UNKNOWN, and `withRetry` refuses it — exactly the shape a Railway restart
 * behind the edge produces.
 *
 * Construct it through {@link throwIfNotOk}, so no read can forget the status.
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
 * Throws unless the response is OK, after the caller has answered its own 404.
 *
 * @param label - What failed, e.g. `getAtlasSeo(/gb/london)`
 */
export function throwIfNotOk(response: Response, label: string): void {
  if (response.ok) {
    return
  }

  throw new CmsResponseError(`${label} failed: ${response.status}`, response.status)
}

/** The `Authorization` header every CMS call carries, SDK and custom endpoint alike. */
export function cmsAuthHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `clients API-Key ${apiKey}` }
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
  //
  // A 404 is exempt. It is an answer at every custom-endpoint read — an
  // unknown id, a stale inbound link, no songs route — and it carries no
  // field-level detail, which is the whole point of the dump. Logging one at
  // error level would buffer a body on a hot path and drown real faults.
  if (!response.ok && response.status !== 404) {
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
 * A path that is not site-relative rejects rather than throwing synchronously,
 * so a caller sees the refusal exactly where it sees a network fault.
 *
 * @param path - Path and query from the leading slash, e.g. `/api/atlas/seo?route=…`
 */
export async function cmsFetch(path: string): Promise<Response> {
  // The path is concatenated, not resolved, so `baseURL` fixes the authority —
  // with one exception: a path starting `@` makes the host userinfo and sends
  // the API key to whatever follows it. `content-index.ts` passes an endpoint
  // the CMS computed rather than one this repo wrote, so the one chokepoint
  // every custom-endpoint read now shares checks instead of trusting.
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`cmsFetch needs a site-relative path, got: ${path}`)
  }

  const { apiKey, baseURL } = getCmsContext()

  return fetchWithErrorDetails(`${baseURL}${path}`, { headers: cmsAuthHeaders(apiKey) })
}
