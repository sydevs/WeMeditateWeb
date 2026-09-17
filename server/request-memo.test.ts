import { describe, expect, it, vi } from 'vitest'

import type { PageContextServer } from 'vike/types'
import { hookViews } from '../tests/_helpers/page-context'
import { memoKey, perRequest } from './request-memo'

/**
 * The vike-internal half of a memo that has already broken once (#108).
 *
 * `memoKey` rides on an internal vike documents but does not support, so these
 * cases pin it against the resolved `vike` in `node_modules`. A vike upgrade
 * that moves it fails here, rather than silently restoring the duplicate read.
 */

describe('memoKey', () => {
  it('collapses the two objects vike hands one request onto one key', async () => {
    const { target, inData, inOnBeforeRender } = await hookViews({ locale: 'en' })

    expect(inData).not.toBe(inOnBeforeRender)
    expect(memoKey(inData)).toBe(target)
    expect(memoKey(inOnBeforeRender)).toBe(target)
  })

  it('reads through vike’s escape hatch without its internal-property warning', async () => {
    const { inData } = await hookViews({ locale: 'en' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      memoKey(inData)

      expect(warn).not.toHaveBeenCalled()
    } finally {
      warn.mockRestore()
    }
  })

  it('falls back to the argument when it is not a proxy', () => {
    // Unit tests and Ladle pass a plain object. They must still memoise.
    const plain = { locale: 'en' } as unknown as PageContextServer

    expect(memoKey(plain)).toBe(plain)
  })
})

describe('perRequest', () => {
  it('runs the loader once across both of a request’s hooks', async () => {
    const cache = new WeakMap<object, Promise<number>>()
    const load = vi.fn().mockResolvedValue(1)
    const { inData, inOnBeforeRender } = await hookViews({ locale: 'en' })

    const first = await perRequest(cache, inData, load)
    const second = await perRequest(cache, inOnBeforeRender, load)

    expect(load).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
  })

  it('shares one in-flight promise rather than racing two loads', async () => {
    // Both hooks can ask concurrently — `pages/+onBeforeRender.ts` does.
    // Storing the promise, not the value, is what keeps that a single read.
    const cache = new WeakMap<object, Promise<number>>()
    const load = vi.fn().mockResolvedValue(1)
    const { inData, inOnBeforeRender } = await hookViews({ locale: 'en' })

    await Promise.all([perRequest(cache, inData, load), perRequest(cache, inOnBeforeRender, load)])

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('runs the loader again for a second request', async () => {
    const cache = new WeakMap<object, Promise<number>>()
    const load = vi.fn().mockResolvedValue(1)

    await perRequest(cache, (await hookViews({ locale: 'en' })).inData, load)
    await perRequest(cache, (await hookViews({ locale: 'en' })).inData, load)

    expect(load).toHaveBeenCalledTimes(2)
  })
})
