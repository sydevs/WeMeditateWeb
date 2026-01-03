/**
 * Tests for PayloadCMS REST API client utilities
 */

import { describe, it, expect } from 'vitest'
import { validateSDKResponse } from './payload-client'

describe('validateSDKResponse', () => {
  describe('throws on invalid responses', () => {
    it('should throw Error when result is undefined', () => {
      expect(() => validateSDKResponse(undefined, 'getPage'))
        .toThrow(Error)
      expect(() => validateSDKResponse(undefined, 'getPage'))
        .toThrow('PayloadCMS SDK returned undefined: getPage')
    })

    it('should throw Error when result is null', () => {
      expect(() => validateSDKResponse(null, 'getMeditation'))
        .toThrow(Error)
      expect(() => validateSDKResponse(null, 'getMeditation'))
        .toThrow('PayloadCMS SDK returned undefined: getMeditation')
    })

    it('should include context in error message', () => {
      try {
        validateSDKResponse(undefined, 'getPageBySlug(home)')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('getPageBySlug(home)')
      }
    })
  })

  describe('returns valid responses', () => {
    it('should return string when valid', () => {
      const result = validateSDKResponse('test', 'getTitle')
      expect(result).toBe('test')
    })

    it('should return number when valid', () => {
      const result = validateSDKResponse(42, 'getCount')
      expect(result).toBe(42)
    })

    it('should return zero (falsy but valid)', () => {
      const result = validateSDKResponse(0, 'getCount')
      expect(result).toBe(0)
    })

    it('should return empty string (falsy but valid)', () => {
      const result = validateSDKResponse('', 'getTitle')
      expect(result).toBe('')
    })

    it('should return false (falsy but valid)', () => {
      const result = validateSDKResponse(false, 'isActive')
      expect(result).toBe(false)
    })

    it('should return object when valid', () => {
      const page = { id: 1, title: 'Home' }
      const result = validateSDKResponse(page, 'getPage')
      expect(result).toEqual(page)
    })

    it('should return array when valid', () => {
      const pages = [{ id: 1 }, { id: 2 }]
      const result = validateSDKResponse(pages, 'getPages')
      expect(result).toEqual(pages)
    })

    it('should return empty array (valid)', () => {
      const result = validateSDKResponse([], 'getPages')
      expect(result).toEqual([])
    })
  })
})
