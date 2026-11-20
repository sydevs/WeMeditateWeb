// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useClipboard } from './useClipboard'

const writeText = vi.fn<(text: string) => Promise<void>>()

function setClipboard(clipboard: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true })
}

async function copy(result: { current: ReturnType<typeof useClipboard> }, text = 'snippet') {
  let ok: boolean | undefined

  await act(async () => {
    ok = await result.current.copy(text)
  })

  return ok
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  writeText.mockReset().mockResolvedValue(undefined)
  setClipboard({ writeText })
})

afterEach(() => {
  vi.useRealTimers()
  setClipboard(undefined)
})

describe('useClipboard', () => {
  it('writes the text, and says so for two seconds', async () => {
    const { result } = renderHook(() => useClipboard())

    expect(await copy(result)).toBe(true)
    expect(writeText).toHaveBeenCalledExactlyOnceWith('snippet')
    expect(result.current.copied).toBe(true)

    advance(1999)
    expect(result.current.copied).toBe(true)

    advance(1)
    expect(result.current.copied).toBe(false)
  })

  it('holds the flag for the timeout it is given', async () => {
    const { result } = renderHook(() => useClipboard({ timeout: 500 }))

    await copy(result)
    advance(500)

    expect(result.current.copied).toBe(false)
  })

  it('restarts the timer on a second copy, rather than ending at the first one', async () => {
    const { result } = renderHook(() => useClipboard())

    await copy(result)
    advance(1500)
    await copy(result)
    advance(1500)
    expect(result.current.copied).toBe(true)

    advance(500)
    expect(result.current.copied).toBe(false)
  })

  it('answers false and raises nothing when the write is refused', async () => {
    writeText.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    const { result } = renderHook(() => useClipboard())

    expect(await copy(result)).toBe(false)
    expect(result.current.copied).toBe(false)
  })

  it('answers false without the Clipboard API', async () => {
    setClipboard(undefined)
    const { result } = renderHook(() => useClipboard())

    expect(await copy(result)).toBe(false)
    expect(result.current.copied).toBe(false)
  })

  it('leaves no timer behind when it unmounts', async () => {
    const { result, unmount } = renderHook(() => useClipboard())

    await copy(result)
    expect(vi.getTimerCount()).toBe(1)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
