// @vitest-environment jsdom
/**
 * The progress handle as a keyboard slider.
 *
 * It lives in its own file because the audio-hook mock is module-wide, and
 * `MeditationPlayer.test.tsx` renders against the real hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MeditationPlayer } from './MeditationPlayer'
import type { AudioPlayerControls, AudioPlayerState } from '@/hooks/audio'
import type { Track } from '@/lib/media/audio'

// Howler never plays under jsdom, so the core hook is replaced by a recorder
// reporting a fixed position in a ten-minute track.
const player = vi.hoisted(() => ({ seek: vi.fn(), currentTime: 100 }))

vi.mock('@/hooks/audio/useAudioPlayer', () => ({
  useAudioPlayer: () => [
    {
      isPlaying: false,
      isPaused: true,
      isLoading: false,
      isReady: true,
      currentTime: player.currentTime,
      duration: 600,
      volume: 1,
      isMuted: false,
      error: null,
    } satisfies AudioPlayerState,
    { seek: player.seek } satisfies Partial<AudioPlayerControls>,
  ],
}))

const track: Track = {
  url: 'https://example.com/voice.mp3',
  title: 'Test Meditation',
  credit: '',
  creditURL: '',
  thumbnailURL: '',
  duration: 600,
}

const slider = () => {
  render(<MeditationPlayer frames={[]} track={track} />)

  return screen.getByRole('slider', { name: 'Meditation' })
}

beforeEach(() => {
  player.seek.mockClear()
  player.currentTime = 100
})

describe('MeditationPlayer progress handle', () => {
  it('is a named slider in the tab order, reporting the position', () => {
    const handle = slider()

    expect(handle.tabIndex).toBe(0)
    expect(handle.getAttribute('aria-valuemin')).toBe('0')
    expect(handle.getAttribute('aria-valuemax')).toBe('600')
    expect(handle.getAttribute('aria-valuenow')).toBe('100')
    expect(handle.getAttribute('aria-valuetext')).toBe('1:40')
  })

  it.each([
    ['ArrowRight', 105],
    ['ArrowUp', 105],
    ['ArrowLeft', 95],
    ['ArrowDown', 95],
    ['PageUp', 130],
    ['PageDown', 70],
    ['Home', 0],
    ['End', 600],
  ])('seeks on %s', (key, target) => {
    const handle = slider()

    // `fireEvent` answers false once a handler has called preventDefault, which
    // is what stops an arrow or a page key scrolling the page as well.
    expect(fireEvent.keyDown(handle, { key })).toBe(false)
    expect(player.seek).toHaveBeenCalledExactlyOnceWith(target)
  })

  it.each([
    [598, 'PageUp', 600],
    [2, 'ArrowLeft', 0],
  ])('stops at the end of the track: from %ss, %s seeks to %ss', (time, key, target) => {
    player.currentTime = time
    fireEvent.keyDown(slider(), { key })

    expect(player.seek).toHaveBeenCalledExactlyOnceWith(target)
  })

  it('leaves every other key alone', () => {
    const handle = slider()

    expect(fireEvent.keyDown(handle, { key: 'Tab' })).toBe(true)
    expect(fireEvent.keyDown(handle, { key: 'Enter' })).toBe(true)
    expect(player.seek).not.toHaveBeenCalled()
  })
})
