/**
 * Error handling utilities for graceful degradation when SahajCloud is unreachable.
 *
 * Provides error type detection, retry logic with exponential backoff, and
 * the volume-bounded Sentry report a degraded read goes through.
 */

// ⚠ `@sentry/react`, unlike the rest of `server/`: `ErrorFallback` imports this
// module in the browser, where `@sentry/cloudflare` does not build. On the
// server its calls still reach the Worker's client, because both SDKs
// re-export one `@sentry/core` — so keep the two packages on the same version.
import * as Sentry from '@sentry/react'

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

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number
  /** Base delay in milliseconds for exponential backoff (default: 1000ms) */
  baseDelayMs?: number
  /** Maximum delay in milliseconds (default: 10000ms) */
  maxDelayMs?: number
  /** Function that decides whether to retry an error (default: retry only network or server errors) */
  shouldRetry?: (error: unknown) => boolean
  /**
   * Whether the final failure is reported to Sentry here (default: true). A read
   * wrapped in {@link degrade} passes `false`: `degrade` reports that failure
   * once per key per isolate, where this would report it on every render.
   */
  reportFailure?: boolean
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  shouldRetry: (error: unknown) => {
    const errorType = detectErrorType(error)

    return errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
  },
  reportFailure: true,
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

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
 * Runs an async function with automatic retry and exponential backoff.
 *
 * This function retries only when `shouldRetry(error)` returns true. By
 * default, it retries NETWORK and SERVER errors, but not CLIENT or
 * UNKNOWN. It reports one outcome to Sentry — a read that recovered, or the
 * final failure — and each retried attempt rides on it as a breadcrumb.
 *
 * @example
 * ```typescript
 * const page = await withRetry(
 *   () => getPageBySlug({ slug: 'home', locale: 'en' }),
 *   { maxAttempts: 3, baseDelayMs: 1000 },
 * )
 * ```
 */
export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }

  if (finalConfig.maxAttempts < 1) {
    throw new Error(`withRetry: maxAttempts must be >= 1, got ${finalConfig.maxAttempts}`)
  }

  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      const result = await fn()

      if (attempt > 0) {
        // eslint-disable-next-line no-console -- a recovery, not a failure: each failed attempt warned
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
        const delay = calculateBackoffDelay(
          attempt,
          finalConfig.baseDelayMs,
          finalConfig.maxDelayMs,
        )

        console.warn(
          `Request failed (attempt ${attempt + 1}/${finalConfig.maxAttempts}), ` +
            `error type: ${errorType}, retrying in ${delay}ms...`,
        )

        // A breadcrumb, not an event: the outcome event carries it, and an
        // event per attempt would bill one read `maxAttempts` times.
        Sentry.addBreadcrumb({
          category: 'retry',
          level: 'warning',
          message: `attempt ${attempt + 1}/${finalConfig.maxAttempts} failed (${errorType})`,
          data: { delay_ms: delay, error: errorText(error) },
        })

        await sleep(delay)
        continue
      }

      console.error(
        `Request failed permanently after ${attempt + 1} ${attempt === 0 ? 'attempt' : 'attempts'}, ` +
          `error type: ${errorType}`,
      )

      if (finalConfig.reportFailure) {
        Sentry.captureException(error, {
          level: 'error',
          tags: {
            retry_attempt: attempt + 1,
            max_attempts: finalConfig.maxAttempts,
            error_type: errorType,
          },
          extra: { will_retry: false, exhausted_retries: isLastAttempt },
        })
      }

      throw error
    }
  }

  // Unreachable. The loop either returns or throws on every iteration.
  // TypeScript requires a terminator because it cannot prove maxAttempts >= 1.
  throw new Error('withRetry: unreachable')
}

/**
 * The warnings this isolate has already sent: per source, each message and
 * signature.
 *
 * A Workers isolate is reused across requests and dropped without notice,
 * which is the bound wanted: often enough that a standing gap cannot go
 * unreported, rare enough that it cannot bill the quota per render.
 */
const reportedWarnings = new Map<string, Set<string>>()

/**
 * Past this a source's memo is emptied rather than pruned: re-reporting a live
 * gap is the harmless direction. Per source, so one source's churn re-arms no
 * other source's warnings.
 */
const MAX_REPORTED_WARNINGS = 128

/**
 * Sends a Sentry warning once per isolate for each distinct `signature` of
 * one source's `message`.
 *
 * For a gap met on every render that stands until someone fixes it: a bare
 * `captureMessage` there bills one event per page view (server/AGENTS.md).
 * It bounds the volume, never the level — so log every occurrence yourself.
 * `source` names the reader, and a signature comes from a small set (an id,
 * an origin, a locale), never from the visitor's URL.
 */
export function warnOnce(
  signature: string,
  message: string,
  context: { source: string; tags?: Record<string, string>; extra?: Record<string, unknown> },
): void {
  let reported = reportedWarnings.get(context.source)

  if (!reported) {
    reported = new Set()
    reportedWarnings.set(context.source, reported)
  }

  const key = JSON.stringify([message, signature])

  if (reported.has(key)) return

  if (reported.size >= MAX_REPORTED_WARNINGS) reported.clear()

  reported.add(key)
  Sentry.captureMessage(message, {
    level: 'warning',
    tags: { ...context.tags, source: context.source },
    extra: context.extra,
  })
}

/** Forgets every warning sent, as a fresh isolate does. For tests. */
export function forgetReportedWarnings(): void {
  reportedWarnings.clear()
}

/** What {@link degrade} says about a read it gave up on. */
export interface Degradation<F> {
  /** The read's name, as the Sentry `source` tag. */
  source: string
  /** What failed and what renders instead, as the log line and the Sentry message. */
  message: string
  /**
   * What the read was for — an id, an origin. Sentry hears of each key once
   * per isolate, and again when its failure changes kind. Omit it where every
   * call reads the same thing, or where the set has no ceiling, such as a
   * visitor's route: each kind of failure is then one event for the source.
   */
  key?: string
  /** What the log line names, where that is not `key`. */
  subject?: string
  /** What the caller renders without the data. */
  fallback: F
  /** Context for the event. Only the first call per key reaches Sentry. */
  extra?: Record<string, unknown>
}

/**
 * Runs a read the response can do without, and answers `fallback` if it fails.
 *
 * Background music, related content, the atlas body, a sitemap half: none may
 * fail what it decorates, and each failure must stay visible. Every failure is
 * logged, and reported through {@link warnOnce}, because these reads run per
 * render and nothing caches them.
 *
 * Hand it the read already in `withRetry` with `reportFailure: false`: the
 * retry is still owed (CACHING.md), and this is the one report of the failure.
 */
export async function degrade<T, F>(
  read: () => Promise<T>,
  degradation: Degradation<F>,
): Promise<T | F> {
  try {
    return await read()
  } catch (error) {
    const { source, message, key = '', subject = key, extra } = degradation
    const errorType = detectErrorType(error)
    const status = readStatus(error) ?? null

    console.warn(subject ? `${message} (${subject}):` : `${message}:`, error)
    warnOnce(`${key} ${errorType} ${status}`, message, {
      source,
      tags: { error_type: errorType },
      extra: { ...extra, status, error: errorText(error) },
    })

    return degradation.fallback
  }
}
