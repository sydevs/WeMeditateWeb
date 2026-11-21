/**
 * `Smoke (ladle)`'s WATCH list covers every `server/` module the Ladle build bundles.
 *
 * WATCH decides whether a push owes the lane a `wemeditate-design` preview. It kept naming
 * `server/cms-types` after #131 renamed that module `server/sahajcloud-types.ts`, which components,
 * hooks and lib import at runtime, and nothing noticed: a path that matches no file fails nothing.
 */
import { existsSync, globSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { readSource, repoRoot, specifiers } from './_source-scan'

const workflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf8')
const WATCH = new RegExp(workflow.match(/^\s*WATCH: '(.+)'$/m)?.[1] ?? '$^')
const IGNORE = new RegExp(workflow.match(/^\s*IGNORE: '(.+)'$/m)?.[1] ?? '$^')

/** The repo-relative module a relative specifier names, or null for a package. */
function resolveModule(from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const base = resolve(dirname(from), specifier)
  const file = ['', '.ts', '.tsx', '/index.ts'].map((ext) => base + ext).find(existsSync)

  return file ? relative(repoRoot, file) : null
}

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
  it('names every server module the Ladle build bundles', () => {
    const modules = bundledServerModules()

    expect(modules).toContain('server/sahajcloud-types.ts')
    expect(modules.filter((file) => !WATCH.test(file))).toEqual([])
  })
})
