/**
 * Every key a call site asks for must exist in the CMS.
 *
 * `TranslationKey` is derived from the generated CMS types, so `tsc` already
 * rejects a key that is not in the schema. This guard checks the other half:
 * that the key is actually *populated* in the committed English snapshot.
 * A key declared upstream but never filled in resolves to its own key path
 * at runtime, which renders as `media.general.playlist` on the page — and
 * types cannot see that.
 *
 * It reads the source rather than importing it, so it covers every call site
 * without rendering anything.
 */

import { describe, it, expect } from 'vitest'
import { globSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import snapshot from '../../lib/translations.en.json'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const SOURCE_GLOBS = [
  'components/**/*.{ts,tsx}',
  'layouts/**/*.{ts,tsx}',
  'pages/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'server/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
]

/** `t('a.b.c')` and `t.rich('a.b.c')`, single or double quoted. */
const CALL_PATTERN = /\bt(?:\.rich)?\(\s*(['"])([a-z0-9_]+(?:\.[a-z0-9_]+)+)\1/gi

/** CLDR suffixes a plural key is stored under. */
const PLURAL_SUFFIXES = ['one', 'few', 'many', 'other']

function readPath(path: string): unknown {
  let node: unknown = snapshot

  for (const segment of path.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[segment]
  }

  return node
}

/** True when the key resolves to a string, or to a populated plural family. */
function resolves(key: string): boolean {
  if (typeof readPath(key) === 'string') return true

  // A plural key is stored expanded. English fills `_one` and `_other`.
  return (
    typeof readPath(`${key}_other`) === 'string' &&
    PLURAL_SUFFIXES.some((suffix) => typeof readPath(`${key}_${suffix}`) === 'string')
  )
}

/**
 * Blanks comments, keeping every newline, so reported line numbers still
 * point at the real line. A `t('tab.sub.key')` in a JSDoc example is
 * documentation, not a call site.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(
      /(^|[^:])\/\/[^\n]*/g,
      (match, lead: string) => lead + ' '.repeat(match.length - lead.length),
    )
}

function sourceFiles(): string[] {
  return SOURCE_GLOBS.flatMap((pattern) =>
    globSync(pattern, { cwd: repoRoot })
      .map((file) => join(repoRoot, file))
      .filter((file) => !file.endsWith('.stories.tsx') && !/\.test\.tsx?$/.test(file)),
  )
}

describe('translation keys', () => {
  it('finds call sites to check (the guard is not silently empty)', () => {
    const hits = sourceFiles().filter((file) =>
      CALL_PATTERN.test(stripComments(readFileSync(file, 'utf8'))),
    )
    CALL_PATTERN.lastIndex = 0

    expect(hits.length).toBeGreaterThan(20)
  })

  it('every t() and t.rich() key exists in the English snapshot', () => {
    const missing: string[] = []

    for (const file of sourceFiles()) {
      const source = stripComments(readFileSync(file, 'utf8'))

      CALL_PATTERN.lastIndex = 0
      for (let match = CALL_PATTERN.exec(source); match; match = CALL_PATTERN.exec(source)) {
        const key = match[2]

        if (!resolves(key)) {
          const line = source.slice(0, match.index).split('\n').length

          missing.push(`${relative(repoRoot, file)}:${line} → ${key}`)
        }
      }
    }

    expect(missing).toEqual([])
  })

  it('every error-category key exists', async () => {
    // These are reached through a lookup table, not a literal at the call
    // site, so the scan above cannot see them.
    const { ErrorType } = await import('../../server/error-utils')
    const { errorTitleKey, errorMessageKey } = await import('../../lib/error-keys')

    const missing = Object.values(ErrorType).flatMap((type) =>
      [errorTitleKey(type), errorMessageKey(type)].filter((key) => !resolves(key)),
    )

    expect(missing).toEqual([])
  })

  it('every page-tag facet label exists', async () => {
    const { PAGE_TAGS } = await import('../../lib/cms-blocks')

    const missing = PAGE_TAGS.filter((tag) => !resolves(`article.general.tag_${tag}`))

    expect(missing).toEqual([])
  })
})
