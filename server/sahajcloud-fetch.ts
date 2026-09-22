/**
 * The one read path for SahajCloud endpoints the Payload SDK cannot express.
 *
 * The SDK covers collection reads. Custom root endpoints — `/api/atlas/seo`,
 * the `related-*` feeds, a content-index block's computed endpoint — belong to
 * no collection, so each read hand-rolled the same preamble and the copies
 * drifted: one lost its request log, and a status-less throw cost a
 * Cloudflare-origin 5xx its retry (#127).
 *
 * Every read resolves its base URL, signs, logs, and answers a non-OK response
 * the same way here. A caller keeps only its own retry wrapper and its own
 * degrade value, because those genuinely differ per read.
 *
 * It sits outside `payload-client.ts` because `cms-client.test.ts` and
 * `atlas-client.test.ts` replace that module wholesale, so anything exported
 * from it is `undefined` in both suites.
 */

import { getCmsContext } from './cms-context'

/**
 * A non-OK SahajCloud response, as an error carrying its status.
 *
 * The status rides on the error because `detectErrorType` reads it
 * structurally and otherwise falls back to matching `50[0-9]` in the message.
 * A plain `Error` therefore classifies a Cloudflare-origin 520, 522 or 524 as
 * UNKNOWN, and `withRetry` refuses it — exactly the shape a Railway restart
 * behind the edge produces.
 */
export class SahajCloudResponseError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SahajCloudResponseError'
    this.status = status
  }
}

/** The `Authorization` header every SahajCloud call carries, SDK and custom endpoint alike. */
export function sahajCloudAuthHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `clients API-Key ${apiKey}` }
}

/**
 * A custom fetch wrapper that logs every SahajCloud request and error body.
 *
 * The SDK throws a `PayloadSDKError` on a non-OK response, carrying the
 * status and the first error message only. This wrapper writes the full
 * response body to the log first, so a 400 says which field it objected
 * to. It also emits the `[PayloadCMS] <method> <url> → <status>` line the
 * debugging workflow in AGENTS.md reads.
 *
 * @param quietStatuses - Statuses to log without their body. Only a caller
 *   that answers a status itself can say it carries nothing worth dumping.
 */
export async function fetchWithErrorDetails(
  input: RequestInfo | URL,
  init?: RequestInit,
  quietStatuses: readonly number[] = [],
): Promise<Response> {
  const response = await fetch(input, init)

  // Log every API request, for debugging.
  console.log(`[PayloadCMS] ${init?.method || 'GET'} ${input} → ${response.status}`)

  // If not OK, log the actual error details before the SDK swallows them.
  if (!response.ok && !quietStatuses.includes(response.status)) {
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
 * Sends the request. Takes a path, not a URL: resolving the base URL here is
 * what removes `getCmsContext()` from every call site.
 */
async function requestSahajCloud(
  path: string,
  quietStatuses: readonly number[],
): Promise<Response> {
  // The path is concatenated, not resolved, so an `@` or `//` prefix moves the
  // authority — and the API key goes with it.
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`sahajCloudFetch needs a site-relative path, got: ${path}`)
  }

  const { apiKey, baseURL } = getCmsContext()

  return fetchWithErrorDetails(
    `${baseURL}${path}`,
    { headers: sahajCloudAuthHeaders(apiKey) },
    quietStatuses,
  )
}

function throwIfNotOk(response: Response, label: string): void {
  if (!response.ok) {
    throw new SahajCloudResponseError(`${label} failed: ${response.status}`, response.status)
  }
}

/**
 * Reads a SahajCloud endpoint the SDK cannot express, and returns its parsed body.
 *
 * Every non-OK response throws, so a caller never branches on a status. Wrap
 * the call in the read's retry policy and catch there.
 *
 * @param path - Path and query from the leading slash, e.g. `/api/atlas/seo?route=…`
 * @param label - What failed, e.g. `getAtlasSeo(/gb/london)`
 */
export async function sahajCloudFetch<T>(path: string, label: string): Promise<T> {
  const response = await requestSahajCloud(path, [])

  throwIfNotOk(response, label)

  return (await response.json()) as T
}

/**
 * The same read, where a 404 is an answer rather than a fault: an unknown id,
 * a stale inbound link, no songs route.
 *
 * It resolves to `null` instead of throwing, so it never spends the retry
 * ladder and never reaches Sentry as an exception. Its body is logged without
 * a dump for the same reason — it carries none of the field-level detail the
 * dump exists for, and the request line still records it.
 */
export async function sahajCloudFetchOptional<T>(path: string, label: string): Promise<T | null> {
  const response = await requestSahajCloud(path, [404])

  if (response.status === 404) {
    return null
  }

  throwIfNotOk(response, label)

  return (await response.json()) as T
}
