/**
 * The Ladle build bundles no `server/` module, so `Smoke (ladle)`'s WATCH list needs no
 * `server/` path.
 *
 * WATCH decides whether a push owes the lane a `wemeditate-design` preview. It once kept naming
 * `server/cms-types` after #131 renamed that module, which components, hooks and lib imported at
 * runtime, and nothing noticed: a path that matches no file fails nothing. Since then everything
 * the browser reads moved out of `server/` (lint holds the line), and this holds the bundle to it.
 */
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { readSource, repoRoot, resolveModule, specifiers } from './_source-scan'

const workflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf8')
const WATCH = new RegExp(workflow.match(/^\s*WATCH: '(.+)'$/m)?.[1] ?? '$^')
const IGNORE = new RegExp(workflow.match(/^\s*IGNORE: '(.+)'$/m)?.[1] ?? '$^')

/** Modules a file imports for a value. An `import type` is erased and reaches no bundle. */
function valueImports(file: string): string[] {
  const from = join(repoRoot, file)

  return specifiers(readSource(from))
    .filter((specifier) => !specifier.typeOnly)
    .map((specifier) => resolveModule(from, specifier.text))
    .filter((target): target is string => target !== null)
}

/** Every `server/` module reachable from the trees Ladle builds, following server-to-server imports. */
function bundledServerModules(): string[] {
  const roots = globSync('{components,hooks,lib,layouts,.ladle}/**/*.{ts,tsx}', {
    cwd: repoRoot,
  }).filter((file) => !IGNORE.test(file))
  const found = new Set<string>()
  const queue = roots.flatMap(valueImports).filter((file) => file.startsWith('server/'))

  while (queue.length) {
    const file = queue.pop()!

    if (found.has(file)) continue
    found.add(file)
    queue.push(...valueImports(file).filter((next) => next.startsWith('server/')))
  }

  return [...found].sort()
}

describe('the ladle WATCH list', () => {
  it('has no server module to name, because the Ladle build bundles none', () => {
    expect(bundledServerModules()).toEqual([])
  })

  it('covers the folders the Ladle build does bundle', () => {
    for (const file of ['components/x.tsx', 'lib/x.ts', 'types/x.ts', 'hooks/x.ts']) {
      expect(WATCH.test(file), file).toBe(true)
    }
  })
})
