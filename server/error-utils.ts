/**
 * Error handling utilities for graceful degradation when CMS is unreachable.
 *
 * This module provides:
 * - Error type detection (network vs server errors)
 * - Retry logic with exponential backoff
 * - User-friendly error categorization
 */

import * as Sentry from '@sentry/react'

/**
 * Error types for better error handling and user messaging
 */
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

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number
  /** Base delay in milliseconds for exponential backoff (default: 1000ms) */
  baseDelayMs?: number
  /** Maximum delay in milliseconds (default: 10000ms) */
  maxDelayMs?: number
  /** Function to determine if error should be retried (default: retry network/server errors only) */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  shouldRetry: (error: unknown, attempt: number) => {
    const errorType = detectErrorType(error)
    // Retry network and server errors, but not client errors
    return errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER
  },
}

/**
 * Detects the type of error for better handling and messaging.
 *
 * @param error - The error to classify
 * @returns The error type classification
 */
export function detectErrorType(error: unknown): ErrorType {
  if (!error) return ErrorType.UNKNOWN

  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  // Network connectivity issues
  const networkPatterns = [
    'fetch failed',
    'network',
    'econnrefused',
    'enotfound',
    'etimedout',
    'connection refused',
    'dns',
    'timeout',
    'getaddrinfo',
  ]

  if (networkPatterns.some(pattern => errorMessage.includes(pattern))) {
    return ErrorType.NETWORK
  }

  // Check for GraphQL/HTTP error responses
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any

    // GraphQL errors from graphql-request
    if (errorObj.response?.status) {
      const status = errorObj.response.status
      if (status >= 500) return ErrorType.SERVER
      if (status >= 400) return ErrorType.CLIENT
    }

    // Standard HTTP errors
    if (errorObj.status) {
      const status = errorObj.status
      if (status >= 500) return ErrorType.SERVER
      if (status >= 400) return ErrorType.CLIENT
    }
  }

  // Server error patterns in message
  const serverPatterns = [
    'internal server error',
    '500',
    '502',
    '503',
    '504',
    'bad gateway',
    'service unavailable',
    'gateway timeout',
  ]

  if (serverPatterns.some(pattern => errorMessage.includes(pattern))) {
    return ErrorType.SERVER
  }

  return ErrorType.UNKNOWN
}

/**
 * Gets a user-friendly error message based on error type.
 *
 * @param error - The error to get a message for
 * @param statusPageUrl - Optional URL to external status page
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown, statusPageUrl?: string): string {
  const errorType = detectErrorType(error)

  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Unable to connect to our content servers. Please check your internet connection and try again.'
    case ErrorType.SERVER:
      const statusMsg = statusPageUrl
        ? ` Check our <a href="${statusPageUrl}" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:text-teal-700 underline">status page</a> for updates.`
        : ''
      return `Our content servers are experiencing issues. We're working to resolve this.${statusMsg}`
    case ErrorType.CLIENT:
      return 'This content is not available. It may have been moved or deleted.'
    default:
      return 'Something went wrong while loading this page. Please try again.'
  }
}

/**
 * Sleeps for a specified duration (for retry delays).
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculates exponential backoff delay with jitter.
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt)

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs)

  // Add jitter (random 0-20% variation) to avoid thundering herd
  const jitter = cappedDelay * 0.2 * Math.random()

  return Math.floor(cappedDelay + jitter)
}

/**
 * Executes an async function with automatic retry and exponential backoff.
 *
 * This function will:
 * 1. Execute the provided async function
 * 2. On failure, determine if the error should be retried
 * 3. If retryable, wait with exponential backoff and retry
 * 4. Log all attempts to Sentry for monitoring
 * 5. Throw the last error if all retries are exhausted
 *
 * @param fn - Async function to execute with retry
 * @param config - Retry configuration
 * @returns Promise resolving to the function's result
 * @throws The last error encountered if all retries fail
 *
 * @example
 * ```typescript
 * const data = await withRetry(
 *   async () => await client.request(query, variables),
 *   { maxAttempts: 3, baseDelayMs: 1000 }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: unknown

  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      // Execute the function
      const result = await fn()

      // If this was a retry that succeeded, log to Sentry
      if (attempt > 0) {
        console.log(`Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`)
        Sentry.captureMessage(`Request succeeded after ${attempt} retries`, {
          level: 'info',
          tags: { retry_attempt: attempt },
        })
      }

      return result
    } catch (error) {
      lastError = error
      const isLastAttempt = attempt === finalConfig.maxAttempts - 1

      // Check if we should retry
      if (!isLastAttempt && finalConfig.shouldRetry(error, attempt)) {
        const delay = calculateBackoffDelay(attempt, finalConfig.baseDelayMs, finalConfig.maxDelayMs)
        const errorType = detectErrorType(error)

        console.log(
          `Request failed (attempt ${attempt + 1}/${finalConfig.maxAttempts}), ` +
          `error type: ${errorType}, retrying in ${delay}ms...`
        )

        // Log retry to Sentry for monitoring
        Sentry.captureException(error, {
          level: 'warning',
          tags: {
            retry_attempt: attempt + 1,
            max_attempts: finalConfig.maxAttempts,
            error_type: errorType,
          },
          extra: {
            delay_ms: delay,
            will_retry: true,
          },
        })

        await sleep(delay)
      } else {
        // Last attempt or non-retryable error
        const errorType = detectErrorType(error)
        console.error(
          `Request failed permanently after ${attempt + 1} ${attempt === 0 ? 'attempt' : 'attempts'}, ` +
          `error type: ${errorType}`
        )

        // Log final failure to Sentry
        Sentry.captureException(error, {
          level: 'error',
          tags: {
            retry_attempt: attempt + 1,
            max_attempts: finalConfig.maxAttempts,
            error_type: errorType,
          },
          extra: {
            will_retry: false,
            exhausted_retries: isLastAttempt,
          },
        })

        throw error
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}
