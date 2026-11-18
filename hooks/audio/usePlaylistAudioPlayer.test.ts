import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { readSource, repoRoot } from '../../tests/guards/_source-scan'

/**
 * The auto-resume flag is a ref, read by an Effect Event and written from event
 * handlers, so no SSR render reaches it and this repo has no DOM environment to
 * drive one. What is checkable is what gets written to it, and that is the
 * defect exactly: reading the flag back off `playerState.isPlaying` made a
 * track change arriving during a load cancel the resume (#256).
 */
const source = readSource(join(repoRoot, 'hooks/audio/usePlaylistAudioPlayer.ts'))

describe('the auto-resume flag', () => {
  it('is what a track load reads as its autoplay', () => {
    expect(source).toContain('autoplay: wantsPlaybackRef.current')
  })

  it('takes only the listener asking for playback, or for silence', () => {
    const writes = [...source.matchAll(/wantsPlaybackRef\.current\s*=\s*(\w+)/g)]

    expect(writes.map((write) => write[1]).sort()).toEqual(['false', 'true'])
  })

  // Counting the writes is not enough on its own: one `true` and one `false`
  // moved into `next` and `previous` would be the original defect, and would
  // still count two.
  it('takes each of them where that listener states it', () => {
    expect(source).toMatch(/const play = \(\) => \{\s*wantsPlaybackRef\.current = true\b/)
    expect(source).toMatch(/const pause = \(\) => \{\s*wantsPlaybackRef\.current = false\b/)
  })
})
