/** Tests for error handling utilities */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Sentry from '@sentry/react'
import { degrade, detectErrorType, ErrorType, warnOnce, withRetry } from './error-utils'

vi.mock('@sentry/react', () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(Sentry.addBreadcrumb).mockClear()
  vi.mocked(Sentry.captureException).mockClear()
  vi.mocked(Sentry.captureMessage).mockClear()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('detectErrorType', () => {
  describe('Network Errors', () => {
    it('should detect fetch failed errors', () => {
      expect(detectErrorType(new Error('fetch failed'))).toBe(ErrorType.NETWORK)
    })

    it('should detect ECONNREFUSED errors', () => {
      expect(detectErrorType(new Error('connect ECONNREFUSED 127.0.0.1:3000'))).toBe(ErrorType.NETWORK)
    })

    it('should detect ETIMEDOUT errors', () => {
      expect(detectErrorType(new Error('request ETIMEDOUT'))).toBe(ErrorType.NETWORK)
    })

    it('should detect DNS errors', () => {
      expect(detectErrorType(new Error('getaddrinfo ENOTFOUND api.example.com'))).toBe(ErrorType.NETWORK)
    })

    it('should detect request timeout phrase', () => {
      expect(detectErrorType(new Error('Request timeout'))).toBe(ErrorType.NETWORK)
    })

    it('should detect connection refused errors', () => {
      expect(detectErrorType(new Error('Connection refused by server'))).toBe(ErrorType.NETWORK)
    })

    it('should detect socket hang up', () => {
      expect(detectErrorType(new Error('socket hang up'))).toBe(ErrorType.NETWORK)
    })
  })

  describe('Pattern tightening (regression guard)', () => {
    // Previously these would false-positive as NETWORK because of substring matches
    // on the bare word "network" or "timeout".
    it('should NOT classify "network policy violation" as NETWORK', () => {
      expect(detectErrorType(new Error('network policy violation'))).toBe(ErrorType.UNKNOWN)
    })

    it('should NOT classify "timeout period" as NETWORK', () => {
      expect(detectErrorType(new Error('The timeout period for this operation has elapsed'))).toBe(ErrorType.UNKNOWN)
    })
  })

  describe('Server Errors', () => {
    it('should detect 500 status code', () => {
      expect(detectErrorType({ response: { status: 500 }, message: 'Server Error' })).toBe(ErrorType.SERVER)
    })

    it('should detect 502 Bad Gateway', () => {
      expect(detectErrorType({ response: { status: 502 }, message: 'Bad Gateway' })).toBe(ErrorType.SERVER)
    })

    it('should detect 503 Service Unavailable', () => {
      expect(detectErrorType({ response: { status: 503 }, message: 'Service Unavailable' })).toBe(ErrorType.SERVER)
    })

    it('should detect 504 Gateway Timeout', () => {
      expect(detectErrorType({ response: { status: 504 }, message: 'Gateway Timeout' })).toBe(ErrorType.SERVER)
    })

    it('should detect internal server error in message', () => {
      expect(detectErrorType(new Error('Internal Server Error occurred'))).toBe(ErrorType.SERVER)
    })

    it('should detect status property directly on error object', () => {
      expect(detectErrorType({ status: 500, message: 'Server Error' })).toBe(ErrorType.SERVER)
    })
  })

  describe('Client Errors', () => {
    it('should detect 400 Bad Request', () => {
      expect(detectErrorType({ response: { status: 400 }, message: 'Bad Request' })).toBe(ErrorType.CLIENT)
    })

    it('should detect 401 Unauthorized', () => {
      expect(detectErrorType({ response: { status: 401 }, message: 'Unauthorized' })).toBe(ErrorType.CLIENT)
    })

    it('should detect 403 Forbidden', () => {
      expect(detectErrorType({ response: { status: 403 }, message: 'Forbidden' })).toBe(ErrorType.CLIENT)
    })

    it('should detect 404 Not Found', () => {
      expect(detectErrorType({ response: { status: 404 }, message: 'Not Found' })).toBe(ErrorType.CLIENT)
    })

    it('should detect status property directly on error object', () => {
      expect(detectErrorType({ status: 404, message: 'Not Found' })).toBe(ErrorType.CLIENT)
    })
  })

  describe('Unknown Errors', () => {
    it('should return UNKNOWN for null', () => {
      expect(detectErrorType(null)).toBe(ErrorType.UNKNOWN)
    })

    it('should return UNKNOWN for undefined', () => {
      expect(detectErrorType(undefined)).toBe(ErrorType.UNKNOWN)
    })

    it('should return UNKNOWN for generic errors', () => {
      expect(detectErrorType(new Error('Something went wrong'))).toBe(ErrorType.UNKNOWN)
    })

    it('should return UNKNOWN for non-error objects', () => {
      expect(detectErrorType({ foo: 'bar' })).toBe(ErrorType.UNKNOWN)
    })

    it('should return UNKNOWN for non-numeric status', () => {
      expect(detectErrorType({ response: { status: 'oops' } })).toBe(ErrorType.UNKNOWN)
    })
  })
})

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should succeed on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    const result = await withRetry(mockFn, { maxAttempts: 3 })

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should retry on network errors and succeed', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, { maxAttempts: 3, baseDelayMs: 100 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should retry on server errors and succeed', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, { maxAttempts: 3, baseDelayMs: 100 })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should NOT retry a read that hit its timeout signal', async () => {
    // What `fetch` rejects with when `AbortSignal.timeout` fires. Retrying it
    // would triple the time a hung SahajCloud read holds a render.
    const timeout = new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    const mockFn = vi.fn().mockRejectedValue(timeout)

    await expect(withRetry(mockFn, { maxAttempts: 3 })).rejects.toBe(timeout)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should NOT retry on client errors', async () => {
    const mockFn = vi.fn().mockRejectedValue({ response: { status: 404 } })

    await expect(withRetry(mockFn, { maxAttempts: 3 })).rejects.toEqual({ response: { status: 404 } })
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should throw after max attempts exhausted', async () => {
    const networkError = new Error('fetch failed')
    const mockFn = vi.fn().mockRejectedValue(networkError)

    const promise = withRetry(mockFn, { maxAttempts: 3, baseDelayMs: 100 })

    const [rejection] = await Promise.allSettled([promise, vi.runAllTimersAsync()])

    expect(rejection.status).toBe('rejected')
    expect(rejection.status === 'rejected' && rejection.reason).toEqual(networkError)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should cap delay at maxDelayMs (full jitter returns max when random=1)', async () => {
    // Force Math.random() = 0.9999... so jitter returns (essentially) the full cap.
    // This pins the delay to maxDelayMs and lets us assert the upper bound.
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.9999999)

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, {
      maxAttempts: 4,
      baseDelayMs: 1000,
      maxDelayMs: 2500,
    })

    // Attempt 1 fires immediately.
    expect(mockFn).toHaveBeenCalledTimes(1)

    // Exponential caps: 1000, 2000, 2500. With random=0.9999 delay ≈ cap.
    await vi.advanceTimersByTimeAsync(1000)
    expect(mockFn).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(2000)
    expect(mockFn).toHaveBeenCalledTimes(3)

    await vi.advanceTimersByTimeAsync(2500)
    expect(mockFn).toHaveBeenCalledTimes(4)

    const result = await promise
    expect(result).toBe('success')
    randomSpy.mockRestore()
  })

  it('should use zero delay when random=0 (full jitter lower bound)', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)

    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, { maxAttempts: 2, baseDelayMs: 1000 })

    // Delay of 0 means the retry schedules immediately. One microtask turn is enough.
    await vi.advanceTimersByTimeAsync(0)
    expect(mockFn).toHaveBeenCalledTimes(2)

    const result = await promise
    expect(result).toBe('success')
    randomSpy.mockRestore()
  })

  it('should respect custom shouldRetry function', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('custom error'))
    const customShouldRetry = vi.fn().mockReturnValue(false)

    await expect(
      withRetry(mockFn, { maxAttempts: 3, shouldRetry: customShouldRetry })
    ).rejects.toThrow('custom error')

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(customShouldRetry).toHaveBeenCalledWith(expect.objectContaining({ message: 'custom error' }))
  })

  it('should handle promises that resolve immediately', async () => {
    const mockFn = vi.fn().mockResolvedValue(42)
    const result = await withRetry(mockFn)

    expect(result).toBe(42)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should handle promises that reject immediately without retry', async () => {
    const mockFn = vi.fn().mockRejectedValue({ response: { status: 400 } })

    await expect(withRetry(mockFn)).rejects.toEqual({ response: { status: 400 } })
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

describe('withRetry reporting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Runs a read that fails on every attempt to the end, past its backoff. */
  async function exhaust(config: Parameters<typeof withRetry>[1] = {}) {
    const read = vi.fn().mockRejectedValue(new Error('fetch failed'))
    const run = withRetry(read, { maxAttempts: 3, baseDelayMs: 100, ...config })

    await Promise.allSettled([run, vi.runAllTimersAsync()])
  }

  it('sends one event for a read that failed on every attempt, not one per attempt', async () => {
    await exhaust()

    expect(Sentry.captureException).toHaveBeenCalledTimes(1)
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ level: 'error' }),
    )
  })

  it('carries each retried attempt on that event as a breadcrumb', async () => {
    await exhaust()

    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(2)
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'retry', message: 'attempt 1/3 failed (NETWORK)' }),
    )
  })

  it('leaves the report to a caller that degrades', async () => {
    await exhaust({ reportFailure: false })

    expect(Sentry.captureException).not.toHaveBeenCalled()
  })
})

describe('warnOnce', () => {
  it('sends a signature once per isolate, at warning', () => {
    warnOnce('gap-a', 'A gap', { source: 'warnOnce.test', extra: { id: 1 } })
    warnOnce('gap-a', 'A gap', { source: 'warnOnce.test', extra: { id: 1 } })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(Sentry.captureMessage).toHaveBeenCalledWith('A gap', {
      level: 'warning',
      tags: { source: 'warnOnce.test' },
      extra: { id: 1 },
    })
  })

  it('keeps two sources apart when their signatures match', () => {
    warnOnce('gap-b', 'A gap', { source: 'warnOnce.test.one' })
    warnOnce('gap-b', 'A gap', { source: 'warnOnce.test.two' })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
  })

  it('forgets everything past its cap, so a live gap reports again rather than never', () => {
    warnOnce('gap-c', 'A gap', { source: 'warnOnce.test.cap' })

    for (let index = 0; index < 128; index++) {
      warnOnce(`filler-${index}`, 'Filler', { source: 'warnOnce.test.cap' })
    }

    vi.mocked(Sentry.captureMessage).mockClear()
    warnOnce('gap-c', 'A gap', { source: 'warnOnce.test.cap' })

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
  })
})

describe('degrade', () => {
  const songs = (key: string) => ({
    source: 'degrade.test',
    message: 'Songs failed; rendering voice-only',
    key,
    fallback: [] as string[],
    extra: { meditationId: key },
  })

  it('answers the read when it succeeds, and reports nothing', async () => {
    expect(await degrade(async () => ['raga'], songs('1'))).toEqual(['raga'])
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('answers the fallback when the read fails, rather than throwing', async () => {
    const badGateway = Object.assign(new Error('songs failed: 502'), { status: 502 })

    expect(await degrade(() => Promise.reject(badGateway), songs('2'))).toEqual([])
    expect(Sentry.captureMessage).toHaveBeenCalledWith('Songs failed; rendering voice-only', {
      level: 'warning',
      tags: { error_type: ErrorType.SERVER, source: 'degrade.test' },
      extra: { meditationId: '2', status: 502, error: 'songs failed: 502' },
    })
  })

  it('logs every failure but reports a key once per isolate', async () => {
    // These reads run per render and nothing caches them, so a standing
    // failure reported per call bills one event per page view.
    const failing = () => Promise.reject(new Error('fetch failed'))

    await degrade(failing, songs('3'))
    await degrade(failing, songs('3'))

    expect(console.warn).toHaveBeenCalledTimes(2)
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
  })

  it('reports a key it has not seen, and a key whose failure changed kind', async () => {
    await degrade(() => Promise.reject(new Error('fetch failed')), songs('4'))
    await degrade(() => Promise.reject(new Error('fetch failed')), songs('5'))
    await degrade(() => Promise.reject(Object.assign(new Error('x'), { status: 403 })), songs('5'))

    expect(Sentry.captureMessage).toHaveBeenCalledTimes(3)
  })
})
