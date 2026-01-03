/**
 * Tests for error handling utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  detectErrorType,
  ErrorType,
  getUserFriendlyErrorMessage,
  withRetry,
} from './error-utils'

describe('detectErrorType', () => {
  describe('Network Errors', () => {
    it('should detect fetch failed errors', () => {
      const error = new Error('fetch failed')
      expect(detectErrorType(error)).toBe(ErrorType.NETWORK)
    })

    it('should detect ECONNREFUSED errors', () => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:3000')
      expect(detectErrorType(error)).toBe(ErrorType.NETWORK)
    })

    it('should detect ETIMEDOUT errors', () => {
      const error = new Error('request ETIMEDOUT')
      expect(detectErrorType(error)).toBe(ErrorType.NETWORK)
    })

    it('should detect DNS errors', () => {
      const error = new Error('getaddrinfo ENOTFOUND api.example.com')
      expect(detectErrorType(error)).toBe(ErrorType.NETWORK)
    })

    it('should detect timeout errors', () => {
      const error = new Error('Request timeout')
      expect(detectErrorType(error)).toBe(ErrorType.NETWORK)
    })

    it('should detect connection refused errors', () => {
      const error = new Error('Connection refused by server')
      expect(detectErrorType(error)).toBe(ErrorType.NETWORK)
    })
  })

  describe('Server Errors', () => {
    it('should detect 500 status code', () => {
      const error = { response: { status: 500 }, message: 'Server Error' }
      expect(detectErrorType(error)).toBe(ErrorType.SERVER)
    })

    it('should detect 502 Bad Gateway', () => {
      const error = { response: { status: 502 }, message: 'Bad Gateway' }
      expect(detectErrorType(error)).toBe(ErrorType.SERVER)
    })

    it('should detect 503 Service Unavailable', () => {
      const error = { response: { status: 503 }, message: 'Service Unavailable' }
      expect(detectErrorType(error)).toBe(ErrorType.SERVER)
    })

    it('should detect 504 Gateway Timeout', () => {
      const error = { response: { status: 504 }, message: 'Gateway Timeout' }
      expect(detectErrorType(error)).toBe(ErrorType.SERVER)
    })

    it('should detect internal server error in message', () => {
      const error = new Error('Internal Server Error occurred')
      expect(detectErrorType(error)).toBe(ErrorType.SERVER)
    })

    it('should detect status property directly on error object', () => {
      const error = { status: 500, message: 'Server Error' }
      expect(detectErrorType(error)).toBe(ErrorType.SERVER)
    })
  })

  describe('Client Errors', () => {
    it('should detect 400 Bad Request', () => {
      const error = { response: { status: 400 }, message: 'Bad Request' }
      expect(detectErrorType(error)).toBe(ErrorType.CLIENT)
    })

    it('should detect 401 Unauthorized', () => {
      const error = { response: { status: 401 }, message: 'Unauthorized' }
      expect(detectErrorType(error)).toBe(ErrorType.CLIENT)
    })

    it('should detect 403 Forbidden', () => {
      const error = { response: { status: 403 }, message: 'Forbidden' }
      expect(detectErrorType(error)).toBe(ErrorType.CLIENT)
    })

    it('should detect 404 Not Found', () => {
      const error = { response: { status: 404 }, message: 'Not Found' }
      expect(detectErrorType(error)).toBe(ErrorType.CLIENT)
    })

    it('should detect status property directly on error object', () => {
      const error = { status: 404, message: 'Not Found' }
      expect(detectErrorType(error)).toBe(ErrorType.CLIENT)
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
      const error = new Error('Something went wrong')
      expect(detectErrorType(error)).toBe(ErrorType.UNKNOWN)
    })

    it('should return UNKNOWN for non-error objects', () => {
      expect(detectErrorType({ foo: 'bar' })).toBe(ErrorType.UNKNOWN)
    })
  })
})

describe('getUserFriendlyErrorMessage', () => {
  it('should return network error message', () => {
    const error = new Error('fetch failed')
    const message = getUserFriendlyErrorMessage(error)
    expect(message).toContain('Unable to connect')
    expect(message).toContain('internet connection')
  })

  it('should return server error message without status page', () => {
    const error = { response: { status: 500 }, message: 'Server Error' }
    const message = getUserFriendlyErrorMessage(error)
    expect(message).toContain('servers are experiencing issues')
    expect(message).not.toContain('status page')
  })

  it('should return server error message with status page link', () => {
    const error = { response: { status: 503 }, message: 'Service Unavailable' }
    const statusPageUrl = 'https://status.example.com'
    const message = getUserFriendlyErrorMessage(error, statusPageUrl)
    expect(message).toContain('servers are experiencing issues')
    expect(message).toContain('status page')
    expect(message).toContain(statusPageUrl)
    expect(message).toContain('target="_blank"')
    expect(message).toContain('rel="noopener noreferrer"')
  })

  it('should return client error message', () => {
    const error = { response: { status: 404 }, message: 'Not Found' }
    const message = getUserFriendlyErrorMessage(error)
    expect(message).toContain('not available')
    expect(message).toContain('moved or deleted')
  })

  it('should return generic error message for unknown errors', () => {
    const error = new Error('Unexpected error')
    const message = getUserFriendlyErrorMessage(error)
    expect(message).toContain('Something went wrong')
    expect(message).toContain('try again')
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

    const promise = withRetry(mockFn, {
      maxAttempts: 3,
      baseDelayMs: 100,
    })

    // Fast-forward through delays
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

    const promise = withRetry(mockFn, {
      maxAttempts: 3,
      baseDelayMs: 100,
    })

    // Fast-forward through delays
    await vi.runAllTimersAsync()

    const result = await promise

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should NOT retry on client errors', async () => {
    const mockFn = vi.fn().mockRejectedValue({ response: { status: 404 } })

    await expect(
      withRetry(mockFn, { maxAttempts: 3 })
    ).rejects.toEqual({ response: { status: 404 } })

    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should throw after max attempts exhausted', async () => {
    const networkError = new Error('fetch failed')
    const mockFn = vi.fn().mockRejectedValue(networkError)

    // Start the retry operation and handle timers concurrently
    const promise = withRetry(mockFn, {
      maxAttempts: 3,
      baseDelayMs: 100,
    })

    // Run all timers and wait for rejection concurrently
    const [rejection] = await Promise.allSettled([
      promise,
      vi.runAllTimersAsync(),
    ])

    expect(rejection.status).toBe('rejected')
    expect(rejection.reason).toEqual(networkError)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should use exponential backoff', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
    })

    // First attempt - immediate
    expect(mockFn).toHaveBeenCalledTimes(1)

    // Advance by ~1 second (first retry delay)
    await vi.advanceTimersByTimeAsync(1200)
    expect(mockFn).toHaveBeenCalledTimes(2)

    // Advance by ~2 seconds (second retry delay - exponential)
    await vi.advanceTimersByTimeAsync(2400)
    expect(mockFn).toHaveBeenCalledTimes(3)

    const result = await promise
    expect(result).toBe('success')
  })

  it('should respect custom shouldRetry function', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('custom error'))

    const customShouldRetry = vi.fn().mockReturnValue(false)

    await expect(
      withRetry(mockFn, {
        maxAttempts: 3,
        shouldRetry: customShouldRetry,
      })
    ).rejects.toThrow('custom error')

    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(customShouldRetry).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'custom error' }),
      0
    )
  })

  it('should cap delays at maxDelayMs', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('success')

    const promise = withRetry(mockFn, {
      maxAttempts: 4,
      baseDelayMs: 1000,
      maxDelayMs: 2500, // Cap at 2.5 seconds
    })

    // First retry: ~1s
    await vi.advanceTimersByTimeAsync(1200)
    expect(mockFn).toHaveBeenCalledTimes(2)

    // Second retry: ~2s (capped from 2s)
    await vi.advanceTimersByTimeAsync(2400)
    expect(mockFn).toHaveBeenCalledTimes(3)

    // Third retry: ~2.5s (capped from 4s)
    await vi.advanceTimersByTimeAsync(3000)
    expect(mockFn).toHaveBeenCalledTimes(4)

    const result = await promise
    expect(result).toBe('success')
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
