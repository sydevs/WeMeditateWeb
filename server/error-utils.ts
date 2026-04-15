/**
 * Error handling utilities for graceful degradation when CMS is unreachable.
 *
 * Provides error type detection, retry logic with exponential backoff,
 * and user-friendly message generation.
 */

import * as Sentry from '@sentry/react'

export enum ErrorType {
  /** Network connectivity issues (DNS, timeout, connection refused) */
  NETWORK = 'NETWORK',
  /** Server returned an error status (500, 503, etc.) */
  SERVER = 'SERVER',
  /** Client error (400, 401, 403, 404, etc.) - should not retry */
  CLIENT = 'CLIENT',
  /** Unknown error type */
  UNKNOWN = 'UNKNOWN',
}

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number
  /** Base delay in milliseconds for exponential backoff (default: 1000ms) */
  baseDelayMs?: number
  /** Maximum delay in milliseconds (default: 10000ms) */
  maxDelayMs?: number
  /** Function to determine if error should be retried (default: retry network/server errors only) */
  shouldRetry?: (error: unknown) => boolean
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  shouldRetry: (error: unknown) => {
    const errorType = detectErrorType(error)
    return errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
  },
}

/**
 * Shape of HTTP-like errors we can inspect for status codes.
 */
interface HttpErrorLike {
  response?: { status?: unknown }
  status?: unknown
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const e = error as HttpErrorLike
  const responseStatus = e.response?.status
  if (typeof responseStatus === 'number') return responseStatus
  if (typeof e.status === 'number') return e.status
  return undefined
}

// Error code patterns matched as substrings (codes like ECONNREFUSED can appear
// mid-token, e.g. "connect ECONNREFUSED 127.0.0.1").
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
const NETWORK_PHRASE_PATTERN = /\b(fetch failed|network error|connection refused|connection reset|dns|request timeout|request timed out|socket hang up)\b/i

const SERVER_PHRASE_PATTERN = /\b(internal server error|bad gateway|service unavailable|gateway timeout|50[0-9])\b/i

/**
 * Classifies an error as NETWORK, SERVER, CLIENT, or UNKNOWN.
 */
export function detectErrorType(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN

  // HTTP status codes take precedence — they're unambiguous.
  const status = readStatus(error)
  if (status !== undefined) {
    if (status >= 500) return ErrorType.SERVER
    if (status >= 400) return ErrorType.CLIENT
  }

  const errorMessage = error instanceof Error ? error.message : String(error)
  const lower = errorMessage.toLowerCase()

  if (NETWORK_CODE_PATTERNS.some(code => lower.includes(code))) {
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

/**
 * Returns a plain-text, user-friendly message for an error.
 * Callers that want to surface a status page link should render it separately
 * as a React element — never interpolate URLs into HTML here.
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  switch (detectErrorType(error)) {
    case ErrorType.NETWORK:
      return 'Unable to connect to our content servers. Please check your internet connection and try again.'
    case ErrorType.SERVER:
      return "Our content servers are experiencing issues. We're working to resolve this."
    case ErrorType.CLIENT:
      return 'This content is not available. It may have been moved or deleted.'
    default:
      return 'Something went wrong while loading this page. Please try again.'
  }
}

/**
 * True if the URL parses and uses an http(s) scheme. Used to gate rendering of
 * externally-configured status page links to avoid `javascript:` / `data:` XSS.
 */
export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Exponential backoff with full jitter: delay is a random value in
 * [0, min(base * 2^attempt, maxDelay)]. Spreads retries more evenly than
 * additive jitter, per AWS "Exponential Backoff And Jitter".
 */
function calculateBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt)
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs)
  return Math.floor(Math.random() * cappedDelay)
}

/**
 * Executes an async function with automatic retry and exponential backoff.
 *
 * Retries are only attempted when `shouldRetry(error)` returns true. The default
 * retries NETWORK and SERVER errors but not CLIENT or UNKNOWN. All attempts are
 * reported to Sentry.
 *
 * @example
 * ```typescript
 * const data = await withRetry(
 *   () => client.request(query, variables),
 *   { maxAttempts: 3, baseDelayMs: 1000 }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }

  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      const result = await fn()

      if (attempt > 0) {
        console.log(`Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`)
        Sentry.captureMessage(`Request succeeded after ${attempt} retries`, {
          level: 'info',
          tags: { retry_attempt: attempt },
        })
      }

      return result
    } catch (error) {
      const isLastAttempt = attempt === finalConfig.maxAttempts - 1
      const errorType = detectErrorType(error)

      if (!isLastAttempt && finalConfig.shouldRetry(error)) {
        const delay = calculateBackoffDelay(attempt, finalConfig.baseDelayMs, finalConfig.maxDelayMs)

        console.log(
          `Request failed (attempt ${attempt + 1}/${finalConfig.maxAttempts}), ` +
          `error type: ${errorType}, retrying in ${delay}ms...`
        )

        Sentry.captureException(error, {
          level: 'warning',
          tags: {
            retry_attempt: attempt + 1,
            max_attempts: finalConfig.maxAttempts,
            error_type: errorType,
          },
          extra: { delay_ms: delay, will_retry: true },
        })

        await sleep(delay)
        continue
      }

      console.error(
        `Request failed permanently after ${attempt + 1} ${attempt === 0 ? 'attempt' : 'attempts'}, ` +
        `error type: ${errorType}`
      )

      Sentry.captureException(error, {
        level: 'error',
        tags: {
          retry_attempt: attempt + 1,
          max_attempts: finalConfig.maxAttempts,
          error_type: errorType,
        },
        extra: { will_retry: false, exhausted_retries: isLastAttempt },
      })

      throw error
    }
  }

  // Unreachable: the loop either returns or throws on every iteration.
  // TypeScript requires a terminator because it can't prove maxAttempts >= 1.
  throw new Error('withRetry: unreachable')
}
