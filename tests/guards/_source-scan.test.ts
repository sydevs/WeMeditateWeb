/**
 * The shared scanner's own spec, so each guard built on it tests only its rule.
 *
 * Three guards each asserted the scan set matched something, over this same
 * expression, so a moved directory reds one test rather than three saying the
 * same thing. A guard that narrows `componentGlobs` to a set of its own owes
 * its own copy again.
 */

import { describe, it, expect } from 'vitest'
import { componentGlobs, sourceFiles, specifiers } from './_source-scan'

describe('the shared component scan set', () => {
  it('matches the component tree (no guard built on it is silently empty)', () => {
    expect(sourceFiles(componentGlobs).length).toBeGreaterThan(50)
  })
})

describe('specifiers', () => {
  it('reads every spelling of an import', () => {
    // Without this, a parser that missed a form would make every guard built on
    // it pass forever.
    const sample = [
      "import { A } from '../a'",
      "import type { B } from '../b'",
      "export { C } from '../c'",
      "export type { C2 } from '../c2'",
      "const D = lazy(() => import('../d'))",
      "import '../e.css'",
      "type F = import('../f').G",
      "type H = typeof import('../h')",
    ].join('\n')

    expect(specifiers(sample)).toEqual([
      { text: '../a', typeOnly: false },
      { text: '../b', typeOnly: true },
      { text: '../c', typeOnly: false },
      { text: '../c2', typeOnly: true },
      { text: '../d', typeOnly: false },
      { text: '../e.css', typeOnly: false },
      { text: '../f', typeOnly: true },
      { text: '../h', typeOnly: true },
    ])
  })
})
