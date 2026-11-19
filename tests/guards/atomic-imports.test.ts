/**
 * A component imports only from its own atomic level or a lower one.
 *
 * Atoms compose into molecules, molecules into organisms, organisms into
 * templates. An import running the other way makes the lower level depend on
 * the higher one, so the higher one can no longer be changed, moved or deleted
 * without reaching under it. The `Image` atom once read its lightbox context
 * out of `molecules/Lightbox`; the contract between the two now lives with the
 * atom, which the molecule is free to import.
 *
 * Read from the source, because an import is a fact about the code and a
 * render never shows one.
 */

import ts from 'typescript'
import { describe, it, expect } from 'vitest'
import { dirname, relative, resolve, sep } from 'node:path'
import { parse, readSource, repoRoot, sourceFiles, walk } from './_source-scan'

const LEVELS = ['atoms', 'molecules', 'organisms', 'templates'] as const

/** The atomic level a repo path sits in, or `null` outside the four. */
function levelOf(path: string): number | null {
  const [root, level] = path.split(sep)

  return root === 'components' ? LEVELS.indexOf(level as (typeof LEVELS)[number]) : null
}

/** Every module specifier `source` names: static imports, re-exports and `import()`. */
export function specifiers(source: string): string[] {
  const found: string[] = []

  walk(parse(source), (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      found.push(node.moduleSpecifier.text)
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      found.push(node.arguments[0].text)
    }
  })

  return found
}

/** `file:specifier` for every import in `file` that reaches a higher level. */
function upwardImports(file: string): string[] {
  const path = relative(repoRoot, file)
  const own = levelOf(path)

  if (own === null || own < 0) {
    return []
  }

  return specifiers(readSource(file))
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

  it('reads every spelling of an import', () => {
    // Without this, a parser that missed a form would make the guard above pass forever.
    const sample = [
      "import { A } from '../a'",
      "import type { B } from '../b'",
      "export { C } from '../c'",
      "const D = lazy(() => import('../d'))",
      "import '../e.css'",
    ].join('\n')

    expect(specifiers(sample)).toEqual(['../a', '../b', '../c', '../d', '../e.css'])
  })
})
