/**
 * Replaces the old `getUserFriendlyErrorMessage` suite in
 * `server/error-utils.test.ts`. Same guarantee — each error category
 * produces its own copy — but the copy now comes from the CMS, so the test
 * resolves the key through the committed English snapshot.
 */

import { describe, it, expect } from 'vitest'
import { ErrorType } from '../server/error-utils'
import { errorMessageKey, errorTitleKey } from './error-keys'
import { createT, EN_TRANSLATIONS } from './i18n'

const t = createT(EN_TRANSLATIONS, 'en')

describe('errorMessageKey', () => {
  it('returns the network message', () => {
    const message = t(errorMessageKey(ErrorType.NETWORK))
    expect(message).toContain('Unable to connect')
    expect(message).toContain('internet connection')
  })

  it('returns the server message', () => {
    expect(t(errorMessageKey(ErrorType.SERVER))).toContain('servers are experiencing issues')
  })

  it('returns the not-found message', () => {
    const message = t(errorMessageKey(ErrorType.CLIENT))
    expect(message).toContain('not available')
    expect(message).toContain('moved or deleted')
  })

  it('returns the generic message for an unknown error', () => {
    const message = t(errorMessageKey(ErrorType.UNKNOWN))
    expect(message).toContain('Something went wrong')
    expect(message).toContain('try again')
  })

  it('never embeds HTML (messages are plain text)', () => {
    for (const type of Object.values(ErrorType)) {
      const message = t(errorMessageKey(type))
      expect(message).not.toContain('<')
      expect(message).not.toContain('href=')
    }
  })
})

describe('errorTitleKey', () => {
  it('pairs each title with the message for the same category', () => {
    // The bug this replaces: a 404 showed the UNKNOWN body under the
    // "Content Not Found" title, because the body was re-detected from the
    // error's message text instead of the resolved type.
    expect(t(errorTitleKey(ErrorType.CLIENT))).toBe('Content Not Found')
    expect(t(errorMessageKey(ErrorType.CLIENT))).toContain('This content is not available')
  })

  it('gives every category its own title', () => {
    const titles = Object.values(ErrorType).map((type) => t(errorTitleKey(type)))
    expect(new Set(titles).size).toBe(titles.length)
  })
})
