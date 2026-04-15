/**
 * Tests for error handling utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  detectErrorType,
  ErrorType,
  getUserFriendlyErrorMessage,
  isSafeHttpUrl,
  withRetry,
} from './error-utils'

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

describe('getUserFriendlyErrorMessage', () => {
  it('returns network error message', () => {
    const message = getUserFriendlyErrorMessage(new Error('fetch failed'))
    expect(message).toContain('Unable to connect')
    expect(message).toContain('internet connection')
  })

  it('returns server error message', () => {
    const message = getUserFriendlyErrorMessage({ response: { status: 500 } })
    expect(message).toContain('servers are experiencing issues')
  })

  it('returns client error message', () => {
    const message = getUserFriendlyErrorMessage({ response: { status: 404 } })
    expect(message).toContain('not available')
    expect(message).toContain('moved or deleted')
  })

  it('returns generic error message for unknown errors', () => {
    const message = getUserFriendlyErrorMessage(new Error('Unexpected error'))
    expect(message).toContain('Something went wrong')
    expect(message).toContain('try again')
  })

  it('never embeds HTML (messages are plain text)', () => {
    const message = getUserFriendlyErrorMessage({ response: { status: 500 } })
    expect(message).not.toContain('<')
    expect(message).not.toContain('href=')
  })
})

describe('isSafeHttpUrl', () => {
  it('accepts https URLs', () => {
    expect(isSafeHttpUrl('https://status.example.com')).toBe(true)
  })

  it('accepts http URLs', () => {
    expect(isSafeHttpUrl('http://status.example.com')).toBe(true)
  })

  it('rejects javascript: URLs', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URLs', () => {
    expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('rejects file: URLs', () => {
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false)
  })

  it('rejects malformed input', () => {
    expect(isSafeHttpUrl('not a url')).toBe(false)
    expect(isSafeHttpUrl('')).toBe(false)
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

    // Delay of 0 means the retry schedules immediately — one microtask turn is enough.
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
