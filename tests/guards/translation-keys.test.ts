/**
 * Every key a call site asks for must exist in SahajCloud.
 *
 * `TranslationKey` is derived from the generated SahajCloud types, so `tsc` already
 * rejects a key that is not in the schema. This guard checks the other half:
 * that the key is actually *populated* in the committed English snapshot.
 * A key declared upstream but never filled in, here or live, renders nothing
 * a visitor can read, and types cannot see that.
 *
 * It reads the source rather than importing it, so it covers every call site
 * without rendering anything.
 */

import { describe, it, expect } from 'vitest'
import { relative } from 'node:path'
import { lineAt, readSource, repoRoot, sourceFiles } from './_source-scan'
import { enT, type TranslationKey } from '@/lib/i18n/i18n'
import { ErrorType } from '@/lib/errors/error-type'
import { errorMessageKey, errorTitleKey } from '@/lib/errors/error-keys'
import { PAGE_TAG_KEYS } from '@/lib/content/blocks'
import { RELATED_CONTENT_KEYS } from '@/components/organisms/RelatedContent/RelatedContentLoader'

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

/**
 * True when the key resolves to real copy.
 *
 * This asks the runtime accessor rather than re-walking the snapshot, so
 * the guard cannot drift from what `createT` actually does — including its
 * plural-family fallback, which `count` exercises. Both answers `createT`
 * gives an unresolved key count as unresolved here, because which one it
 * gives depends on the build.
 */
function resolves(key: string): boolean {
  const value = enT(key as TranslationKey, { count: 1 })

  return value !== key && value !== ''
}

describe('translation keys', () => {
  it('finds call sites to check (the guard is not silently empty)', () => {
    const hits = sourceFiles(SOURCE_GLOBS).filter((file) => {
      CALL_PATTERN.lastIndex = 0

      return CALL_PATTERN.test(readSource(file))
    })

    expect(hits.length).toBeGreaterThan(20)
  })

  it('every t() and t.rich() key exists in the English snapshot', () => {
    const missing: string[] = []

    for (const file of sourceFiles(SOURCE_GLOBS)) {
      const source = readSource(file)

      CALL_PATTERN.lastIndex = 0
      for (let match = CALL_PATTERN.exec(source); match; match = CALL_PATTERN.exec(source)) {
        const key = match[2]

        if (!resolves(key)) {
          missing.push(`${relative(repoRoot, file)}:${lineAt(source, match.index)} → ${key}`)
        }
      }
    }

    expect(missing).toEqual([])
  })

  it('every key reached through a lookup table exists', () => {
    // A key indexed out of a table is invisible to the source scan above.
    // Each table here is a `Record<…, TranslationKey>`, so adding one means
    // adding it to this list.
    const tabled: TranslationKey[] = [
      ...Object.values(ErrorType).flatMap((type) => [errorTitleKey(type), errorMessageKey(type)]),
      ...Object.values(PAGE_TAG_KEYS),
      ...Object.values(RELATED_CONTENT_KEYS).flatMap((pair) => [pair.title, pair.loading]),
    ]

    expect(tabled.filter((key) => !resolves(key))).toEqual([])
  })

  it('reports a key it cannot resolve', () => {
    // Proves `resolves` actually discriminates — without this, a change to
    // createT's fallback could make the guard pass on everything.
    expect(resolves('common.general.loading')).toBe(true)
    expect(resolves('common.general.no_such_key')).toBe(false)
  })
})
