/**
 * A component imports only from its own atomic level or a lower one.
 *
 * Atoms compose into molecules, molecules into organisms, organisms into
 * templates. An import running the other way makes the lower level depend on
 * the higher one, so the higher one can no longer be changed, moved or deleted
 * without reaching under it. A contract a lower level shares with a higher
 * one lives at the lower level, where both can import it.
 *
 * Read from the source, because an import is a fact about the code and a
 * render never shows one.
 */

import { describe, it, expect } from 'vitest'
import { dirname, relative, resolve, sep } from 'node:path'
import { readSource, repoRoot, sourceFiles, specifiers } from './_source-scan'

const LEVELS = ['atoms', 'molecules', 'organisms', 'templates'] as const

/** The atomic level a repo path sits in, or `null` outside the four. */
function levelOf(path: string): number | null {
  const [root, level] = path.split(sep)

  return root === 'components' ? LEVELS.indexOf(level as (typeof LEVELS)[number]) : null
}

/** `file:specifier` for every import in `file` that reaches a higher level. */
function upwardImports(file: string): string[] {
  const path = relative(repoRoot, file)
  const own = levelOf(path)

  if (own === null || own < 0) {
    return []
  }

  return specifiers(readSource(file))
    .map((specifier) => specifier.text)
    .filter((specifier) => specifier.startsWith('.'))
    .filter((specifier) => {
      const target = levelOf(relative(repoRoot, resolve(dirname(file), specifier)))

      return target !== null && target > own
    })
    .map((specifier) => `${path}: ${specifier}`)
}

describe('atomic imports', () => {
  const files = sourceFiles(['components/**/*.ts', 'components/**/*.tsx'])

  it('scans the component tree (the guard is not silently empty)', () => {
    expect(files.filter((file) => levelOf(relative(repoRoot, file)) === 0).length).toBeGreaterThan(
      20,
    )
  })

  it('no component imports from a level above its own', () => {
    expect(files.flatMap(upwardImports)).toEqual([])
  })
})
