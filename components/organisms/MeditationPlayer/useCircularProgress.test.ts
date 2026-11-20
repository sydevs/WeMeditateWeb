// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCircularProgress } from './useCircularProgress'

const DURATION = 600

// A 100×100 ring at the origin: 0° is the top, and the angle runs clockwise.
const AT = {
  right: [100, 50],
  bottom: [50, 100],
  left: [0, 50],
  justPastTop: [55, 0],
  justBeforeTop: [45, 0],
} as const

type Point = readonly [number, number]

function setup(currentTime = 0) {
  const onSeek = vi.fn()
  const hook = renderHook(
    ({ time }) => useCircularProgress({ currentTime: time, duration: DURATION, onSeek }),
    { initialProps: { time: currentTime } },
  )
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

  ring.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect
  hook.result.current.progressRef.current = ring
  act(() => hook.result.current.startDrag())

  return { ...hook, onSeek }
}

// jsdom's TouchEvent takes only real `Touch` objects, which it cannot build.
function touch(type: 'touchmove' | 'touchend' | 'touchcancel', [clientX, clientY]: Point = [0, 0]) {
  const event = new Event(type, { cancelable: true })

  Object.defineProperty(event, 'touches', {
    value: type === 'touchmove' ? [{ clientX, clientY }] : [],
  })
  act(() => {
    window.dispatchEvent(event)
  })

  return event
}

function mouse(type: 'mousemove' | 'mouseup', [clientX, clientY]: Point = [0, 0]) {
  act(() => {
    window.dispatchEvent(new MouseEvent(type, { clientX, clientY }))
  })
}

describe('useCircularProgress — dragging the handle', () => {
  it('previews the time under the pointer, and seeks once, on release', () => {
    const { result, onSeek } = setup()

    mouse('mousemove', AT.right)
    expect(result.current.displayTime).toBe(150)

    mouse('mousemove', AT.bottom)
    expect(result.current.displayTime).toBe(300)
    expect(onSeek).not.toHaveBeenCalled()

    mouse('mouseup')
    expect(result.current.isDragging).toBe(false)
    expect(onSeek).toHaveBeenCalledExactlyOnceWith(300)

    mouse('mousemove', AT.left)
    expect(result.current.displayTime).toBe(300)
  })

  it('holds the seek target until the player reports reaching it', () => {
    const { result, rerender } = setup()

    mouse('mousemove', AT.bottom)
    mouse('mouseup')
    rerender({ time: 0.25 })
    expect(result.current.displayTime).toBe(300)

    rerender({ time: 300.2 })
    expect(result.current.displayTime).toBe(300.2)
  })

  it('follows a touch, and keeps the page from scrolling under it', () => {
    const { result, onSeek } = setup()

    expect(touch('touchmove', AT.left).defaultPrevented).toBe(true)
    expect(result.current.displayTime).toBe(450)

    touch('touchend')
    expect(result.current.isDragging).toBe(false)
    expect(onSeek).toHaveBeenCalledExactlyOnceWith(450)
  })

  it('stops at the end rather than wrapping past the top to the start', () => {
    const { result } = setup(590)

    mouse('mousemove', AT.justPastTop)
    expect(result.current.displayTime).toBe(DURATION)
  })

  it('stops at the start rather than wrapping back past the top to the end', () => {
    const { result } = setup(10)

    mouse('mousemove', AT.justBeforeTop)
    expect(result.current.displayTime).toBe(0)
  })

  // The system or the browser took the gesture back. Nothing was released,
  // so nothing is seeked, and the page gets its touch scrolling back.
  it('ends the drag on a cancelled touch, without seeking', () => {
    const { result, onSeek } = setup(20)

    touch('touchmove', AT.left)
    touch('touchcancel')

    expect(result.current.isDragging).toBe(false)
    expect(result.current.displayTime).toBe(20)
    expect(touch('touchmove', AT.right).defaultPrevented).toBe(false)
    expect(result.current.displayTime).toBe(20)
    expect(onSeek).not.toHaveBeenCalled()
  })
})
