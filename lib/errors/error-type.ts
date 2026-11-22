/**
 * What kind of failure an error is, read the same way on the server and in the
 * browser: `withRetry` retries on it, and `ErrorFallback` words its message by it.
 */

export enum ErrorType {
  /** Network connectivity issues (DNS, timeout, connection refused) */
  NETWORK = 'NETWORK',
  /** Server returned an error status (500, 503, etc.) */
  SERVER = 'SERVER',
  /** Client error (400, 401, 403, 404, etc.). Do not retry these. */
  CLIENT = 'CLIENT',
  /** Unknown error type */
  UNKNOWN = 'UNKNOWN',
}

/** Shape of an HTTP-like error this module can read a status code from. */
interface HttpErrorLike {
  response?: { status?: unknown }
  status?: unknown
}

/**
 * The HTTP status an error carries, where it carries one. A `PayloadSDKError`
 * and a `SahajCloudResponseError` both do, so a caller that answers one status
 * itself reads it here rather than matching the message.
 */
export function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const e = error as HttpErrorLike
  const responseStatus = e.response?.status

  if (typeof responseStatus === 'number') return responseStatus
  if (typeof e.status === 'number') return e.status

  return undefined
}

// Error code patterns, matched as substrings. A code like ECONNREFUSED can
// appear mid-token, for example "connect ECONNREFUSED 127.0.0.1".
const NETWORK_CODE_PATTERNS = [
  'econnrefused',
  'econnreset',
  'enotfound',
  'etimedout',
  'eai_again',
  'getaddrinfo',
]

// English phrases matched at word boundaries to avoid false positives like
// "network policy violation" or "timeout: operation completed successfully".
const NETWORK_PHRASE_PATTERN =
  /\b(fetch failed|network error|connection refused|connection reset|dns|request timeout|request timed out|socket hang up)\b/i

const SERVER_PHRASE_PATTERN =
  /\b(internal server error|bad gateway|service unavailable|gateway timeout|50[0-9])\b/i

/** Classifies an error as NETWORK, SERVER, CLIENT, or UNKNOWN. */
export function detectErrorType(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN

  // HTTP status codes take precedence. They are unambiguous.
  const status = readStatus(error)

  if (status !== undefined) {
    if (status >= 500) return ErrorType.SERVER
    if (status >= 400) return ErrorType.CLIENT
  }

  const errorMessage = error instanceof Error ? error.message : String(error)
  const lower = errorMessage.toLowerCase()

  if (NETWORK_CODE_PATTERNS.some((code) => lower.includes(code))) {
    return ErrorType.NETWORK
  }
  if (NETWORK_PHRASE_PATTERN.test(errorMessage)) {
    return ErrorType.NETWORK
  }
  if (SERVER_PHRASE_PATTERN.test(errorMessage)) {
    return ErrorType.SERVER
  }

  return ErrorType.UNKNOWN
}
