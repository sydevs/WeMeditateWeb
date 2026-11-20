/**
 * The smoke legs' watch lists in `ci.yml`. `Smoke (ladle)`'s covers every `server/` module the
 * Ladle build bundles, and `Smoke (web)`'s ignores docs and nothing else.
 *
 * WATCH decides whether a push owes the lane a `wemeditate-design` preview. It kept naming
 * `server/cms-types` after #131 renamed that module `server/sahajcloud-types.ts`, which components,
 * hooks and lib import at runtime, and nothing noticed: a path that matches no file fails nothing.
 */
import { existsSync, globSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'
import { describe, it, expect } from 'vitest'
import { parse, readSource, repoRoot, walk } from './_source-scan'

const workflow = readFileSync(join(repoRoot, '.github/workflows/ci.yml'), 'utf8')

/** One smoke-matrix leg's `watch` or `ignore` regex, read from its `- target:` entry. */
function legPattern(target: string, field: 'watch' | 'ignore'): RegExp {
  const entry = workflow.split(/^\s*- target: /m).find((block) => block.startsWith(`${target}\n`))
  const source = entry?.match(new RegExp(`^\\s*${field}: '(.+)'$`, 'm'))?.[1]

  return new RegExp(source ?? '$^')
}

const WATCH = legPattern('ladle', 'watch')
const IGNORE = legPattern('ladle', 'ignore')

/** The repo-relative module a relative specifier names, or null for a package. */
function resolveModule(from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null
  const base = resolve(dirname(from), specifier)
  const file = ['', '.ts', '.tsx', '/index.ts'].map((ext) => base + ext).find(existsSync)

  return file ? relative(repoRoot, file) : null
}

/** Modules a file imports for a value. An `import type` is erased and reaches no bundle. */
function valueImports(file: string): string[] {
  const out: string[] = []

  walk(parse(readSource(join(repoRoot, file))), (node) => {
    const typeOnly =
      (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) ||
      (ts.isExportDeclaration(node) && node.isTypeOnly)
    const specifier =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
        ? node.moduleSpecifier.text
        : null
    const target = specifier && !typeOnly ? resolveModule(join(repoRoot, file), specifier) : null

    if (target) out.push(target)
  })

  return out
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

/**
 * `Smoke (web)` skips a push that changes only docs, so its ignore list must stay docs-only. A
 * smoke spec, a CI change or the Worker's own config each need a preview to run against, and a
 * wider list would skip the one push that most needs testing.
 */
describe('the web ignore list', () => {
  const WEB_WATCH = legPattern('web', 'watch')
  const WEB_IGNORE = legPattern('web', 'ignore')
  const skipped = (file: string) => WEB_IGNORE.test(file) || !WEB_WATCH.test(file)

  it('skips docs-only paths', () => {
    for (const file of [
      'README.md',
      'docs/rules/testing.md',
      'server/AGENTS.md',
      '.claude/settings.json',
    ]) {
      expect(skipped(file), file).toBe(true)
    }
  })

  it('still builds for tests, CI and every app path', () => {
    for (const file of [
      'tests/smoke/web/pages.smoke.test.ts',
      '.github/workflows/ci.yml',
      'wrangler.toml',
      'pages/index/+Page.tsx',
      'server/atlas-client.ts',
      'package.json',
    ]) {
      expect(skipped(file), file).toBe(false)
    }
  })
})
