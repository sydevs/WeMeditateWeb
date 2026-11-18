/**
 * One home for the fact that the shared scan set matches something.
 *
 * Three guards each asserted it over this same expression, so a moved
 * directory reds one test rather than three saying the same thing. A guard
 * that narrows `componentGlobs` to a set of its own owes its own copy again.
 */

import { describe, it, expect } from 'vitest'
import { componentGlobs, sourceFiles } from './_source-scan'

describe('the shared component scan set', () => {
  it('matches the component tree (no guard built on it is silently empty)', () => {
    expect(sourceFiles(componentGlobs).length).toBeGreaterThan(50)
  })
})
