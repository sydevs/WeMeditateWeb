import { describe, expect, it, vi } from 'vitest'

import { memoKey } from './request-memo'

/**
 * The vike-internal half of a memo that has already broken once (#108).
 *
 * `memoKey` reads `pageContext._originalObject`, which vike documents nowhere
 * and warns about in general. These cases pin the two properties that make the
 * read correct and quiet, against the resolved `vike` in `node_modules` rather
 * than against a description of it. A vike upgrade that drops either one fails
 * here, instead of silently restoring the duplicate CMS read.
 *
 * The deep imports bypass vike's `exports` map on purpose — these are its
 * internals, and there is no public path to them. An import that throws is
 * itself the signal to go and re-read `memoKey`.
 */

const vikeInternal = (file: string) =>
  import(/* @vite-ignore */ new URL(`../node_modules/vike/dist/${file}`, import.meta.url).href)

/** The minimum vike's `assert` calls accept. Both flags are its own guard that
 *  the object it wraps is the original reference — the fact `memoKey` rides. */
const fakePageContext = () => ({
  _isOriginalObject: true,
  _globalContext: { _isOriginalObject: true },
  pageProps: {},
})

describe('memoKey', () => {
  it('collapses the distinct proxies vike builds for two hooks onto one key', async () => {
    const { getPageContextPublicShared } = await vikeInternal(
      'shared-server-client/getPageContextPublicShared.js',
    )
    const request = fakePageContext()

    // What `data()` and `+onBeforeRender` each receive: vike wraps per call.
    const inData = getPageContextPublicShared(request)
    const inOnBeforeRender = getPageContextPublicShared(request)

    expect(inData).not.toBe(inOnBeforeRender)
    expect(memoKey(inData)).toBe(request)
    expect(memoKey(inData)).toBe(memoKey(inOnBeforeRender))
  })

  it('reads `_originalObject` without tripping vike’s internal-property warning', async () => {
    const { getPageContextPublicShared } = await vikeInternal(
      'shared-server-client/getPageContextPublicShared.js',
    )
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      memoKey(getPageContextPublicShared(fakePageContext()))

      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('warns when vike does not skip internal properties, so the case above is live', async () => {
    // Without this, the silence above would also pass if vike stopped warning
    // at all, and the previous case would stop guarding anything.
    const { getPublicProxy } = await vikeInternal('shared-server-client/getPublicProxy.js')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      void getPublicProxy(fakePageContext(), 'pageContext', false)._originalObject

      // vike hands `console.warn` an Error, for the stack trace.
      expect(String(warn.mock.calls[0]?.[0])).toContain('_originalObject')
    } finally {
      warn.mockRestore()
    }
  })

  it('falls back to the argument when it is not a proxy', () => {
    // Unit tests and Ladle pass a plain object. They must still memoise.
    const plain = { locale: 'en' } as never

    expect(memoKey(plain)).toBe(plain)
  })
})
