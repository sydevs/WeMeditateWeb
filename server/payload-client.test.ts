/**
 * Tests for PayloadCMS REST API client utilities
 */

import { describe, it, expect } from 'vitest'
import {
  PayloadAPIError,
  validateSDKResponse,
  toSDKLocale,
} from './payload-client'
import { detectErrorType, ErrorType } from './error-utils'

describe('PayloadAPIError', () => {
  it('should create error with default 500 status', () => {
    const error = new PayloadAPIError('Test error message')

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('PayloadAPIError')
    expect(error.message).toBe('Test error message')
    expect(error.response.status).toBe(500)
  })

  it('should create error with custom status', () => {
    const error = new PayloadAPIError('Not found', 404)

    expect(error.message).toBe('Not found')
    expect(error.response.status).toBe(404)
  })

  it('should be compatible with detectErrorType for server errors', () => {
    const error = new PayloadAPIError('Server error', 500)
    expect(detectErrorType(error)).toBe(ErrorType.SERVER)
  })

  it('should be compatible with detectErrorType for 502 errors', () => {
    const error = new PayloadAPIError('Bad gateway', 502)
    expect(detectErrorType(error)).toBe(ErrorType.SERVER)
  })

  it('should be compatible with detectErrorType for 503 errors', () => {
    const error = new PayloadAPIError('Service unavailable', 503)
    expect(detectErrorType(error)).toBe(ErrorType.SERVER)
  })

  it('should be compatible with detectErrorType for client errors', () => {
    const error = new PayloadAPIError('Not found', 404)
    expect(detectErrorType(error)).toBe(ErrorType.CLIENT)
  })

  it('should be compatible with detectErrorType for 401 errors', () => {
    const error = new PayloadAPIError('Unauthorized', 401)
    expect(detectErrorType(error)).toBe(ErrorType.CLIENT)
  })
})

describe('validateSDKResponse', () => {
  describe('throws on invalid responses', () => {
    it('should throw PayloadAPIError when result is undefined', () => {
      expect(() => validateSDKResponse(undefined, 'getPage'))
        .toThrow(PayloadAPIError)
      expect(() => validateSDKResponse(undefined, 'getPage'))
        .toThrow('PayloadCMS SDK returned undefined: getPage')
    })

    it('should throw PayloadAPIError when result is null', () => {
      expect(() => validateSDKResponse(null, 'getMeditation'))
        .toThrow(PayloadAPIError)
      expect(() => validateSDKResponse(null, 'getMeditation'))
        .toThrow('PayloadCMS SDK returned undefined: getMeditation')
    })

    it('should include context in error message', () => {
      try {
        validateSDKResponse(undefined, 'getPageBySlug(home)')
      } catch (error) {
        expect(error).toBeInstanceOf(PayloadAPIError)
        expect((error as PayloadAPIError).message).toContain('getPageBySlug(home)')
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

describe('toSDKLocale', () => {
  describe('converts underscore to hyphen format', () => {
    it('should convert pt_br to pt-br', () => {
      expect(toSDKLocale('pt_br')).toBe('pt-br')
    })

    it('should convert zh_cn to zh-cn', () => {
      expect(toSDKLocale('zh_cn')).toBe('zh-cn')
    })

    it('should convert zh_tw to zh-tw', () => {
      expect(toSDKLocale('zh_tw')).toBe('zh-tw')
    })
  })

  describe('handles locales without underscore', () => {
    it('should pass through en unchanged', () => {
      expect(toSDKLocale('en')).toBe('en')
    })

    it('should pass through es unchanged', () => {
      expect(toSDKLocale('es')).toBe('es')
    })

    it('should pass through de unchanged', () => {
      expect(toSDKLocale('de')).toBe('de')
    })

    it('should pass through fr unchanged', () => {
      expect(toSDKLocale('fr')).toBe('fr')
    })

    it('should pass through ru unchanged', () => {
      expect(toSDKLocale('ru')).toBe('ru')
    })

    it('should pass through uk unchanged', () => {
      expect(toSDKLocale('uk')).toBe('uk')
    })
  })

  describe('handles already hyphenated locales', () => {
    it('should pass through pt-br unchanged', () => {
      expect(toSDKLocale('pt-br')).toBe('pt-br')
    })

    it('should pass through zh-cn unchanged', () => {
      expect(toSDKLocale('zh-cn')).toBe('zh-cn')
    })
  })
})
