import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot, stripComments } from '../../tests/guards/_source-scan'

/**
 * The auto-resume flag is a ref, read by an Effect Event and written from event
 * handlers, so no SSR render reaches it and no DOM test environment exists here
 * to drive one. What can be checked is where it is written, which is the whole
 * defect: reading it back off `playerState.isPlaying` made a track change
 * during a load cancel the resume (#256).
 */
const source = stripComments(
  readFileSync(join(repoRoot, 'hooks/audio/usePlaylistAudioPlayer.ts'), 'utf8'),
)

/** Whatever identifier the track load passes as its `autoplay` argument. */
const flag = source.match(/autoplay:\s*([\w.]+)/)?.[1]

/** `const <name> = …`, from its first brace to the matching one. */
function body(name: string): string {
  const start = source.indexOf(`const ${name} = `)

  expect(start, `${name} is declared`).toBeGreaterThan(-1)

  const open = source.indexOf('{', start)
  let depth = 0

  for (let at = open; at < source.length; at++) {
    if (source[at] === '{') depth++
    if (source[at] === '}' && --depth === 0) return source.slice(open, at + 1)
  }

  throw new Error(`unbalanced braces after ${name}`)
}

describe('the auto-resume flag', () => {
  it('is what the track load reads as its autoplay', () => {
    expect(flag).toMatch(/\.current$/)
  })

  it.each(['previous', 'next', 'selectTrack'])('is not written by %s', (navigation) => {
    expect(body(navigation)).not.toContain(flag)
    expect(body(navigation)).not.toContain('playerState.isPlaying')
  })

  it('is written only as the listener asking for playback, or for silence', () => {
    const writes = [
      ...source.matchAll(new RegExp(`${flag?.replace('.', '\\.')}\\s*=\\s*(\\w+)`, 'g')),
    ]

    expect(writes.map((write) => write[1]).sort()).toEqual(['false', 'true'])
    expect(body('play')).toContain(`${flag} = true`)
    expect(body('pause')).toContain(`${flag} = false`)
  })
})
