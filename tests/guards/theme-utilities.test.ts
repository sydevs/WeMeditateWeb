/**
 * A utility naming an undeclared token compiles to no CSS, and nothing says so:
 * not the build, not the linter, not the suite. #176's dead classes were visible
 * all the same, because v4 defaults a border colour and an SVG `fill` to
 * `currentColor`, so the element silently took the inherited text colour.
 *
 * Tailwind itself decides what is dead here. `candidatesToCss` compiles a
 * candidate against the real stylesheet and answers `null` when it emits
 * nothing, so the guard models no token sets, no keywords, no variants and no
 * arbitrary-value syntax. That is what the hand-rolled rule could not do: it
 * matched colour utilities by scale, which left a token off a numeric scale
 * (`error-light` beside the declared `error-dark`) and every non-colour
 * namespace unchecked, and it needed a special case for `font-stretch-*`
 * because that prefix carries keywords as well as tokens.
 *
 * What the guard does still choose is **reach**: `WATCHED_PREFIXES` is the list
 * of utility prefixes whose value is a theme token. A prefix missing from it is
 * unwatched, never wrongly flagged — adding one costs nothing but the line,
 * since the compiler supplies the rule.
 *
 * Two shapes are deliberately out of scope. An arbitrary value (`text-[16px]`,
 * `bg-(--var)`) names no token, and a match preceded by `<word>-` is a slug
 * rather than a utility — `how-to-begin` is not a gradient stop.
 */

import { describe, it, expect } from 'vitest'
import { globSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { __unstable__loadDesignSystem } from 'tailwindcss'
import { repoRoot, readSource, lineAt, themeStylesheet } from './_source-scan'

/** `@source "../components";` — the inline form declares classes, not paths. */
const SCANNED_DIRS = [...themeStylesheet.matchAll(/@source\s+"\.\.\/([^"]+)"/g)].map(
  ([, dir]) => dir,
)

const require = createRequire(import.meta.url)
const layouts = join(repoRoot, 'layouts')

const designSystem = await __unstable__loadDesignSystem(themeStylesheet, {
  base: layouts,
  loadStylesheet: async (id, base) => {
    const path = require.resolve(id === 'tailwindcss' ? 'tailwindcss/index.css' : id, {
      paths: [base],
    })

    return { content: readFileSync(path, 'utf8'), base: dirname(path), path }
  },
})

/**
 * Utility prefixes whose value comes from the theme. The colour namespace is
 * most of the list, because most prefixes that take one are its own.
 */
const WATCHED_PREFIXES = [
  'accent',
  'bg',
  'border',
  'caret',
  'decoration',
  'divide',
  'drop-shadow',
  'fill',
  'font',
  'from',
  'inset-ring',
  'inset-shadow',
  'outline',
  'placeholder',
  'ring',
  'ring-offset',
  'rounded',
  'shadow',
  'stroke',
  'text',
  'text-shadow',
  'to',
  'via',
]

/**
 * A variant prefix is dropped rather than matched: it cannot make a dead
 * utility live, or a live one dead. A trailing `/50` opacity and `!` important
 * belong to the candidate, so the compiler is handed both.
 */
const CANDIDATE = new RegExp(
  `(?<![a-z0-9-])(?:${WATCHED_PREFIXES.join('|')})-[a-z0-9][a-z0-9-]*(?:/[a-z0-9.]+)?!?`,
  'g',
)

/** An inline `<style>` block is CSS, where `stroke-width` is a property name. */
const stripStyleBlocks = (source: string): string =>
  source.replace(/<style>[\s\S]*?<\/style>/g, (block) => block.replace(/[^\n]/g, ' '))

interface DeadUtility {
  readonly utility: string
  readonly index: number
}

/** Every watched utility in `source` that the real stylesheet compiles to nothing. */
function findDeadUtilities(source: string): DeadUtility[] {
  const found = [...stripStyleBlocks(source).matchAll(CANDIDATE)].map((match) => ({
    utility: match[0],
    index: match.index,
  }))
  const css = designSystem.candidatesToCss(found.map(({ utility }) => utility))

  return found.filter((_, i) => css[i] === null)
}

describe('theme utilities', () => {
  it('compiles against the real stylesheet', () => {
    expect(SCANNED_DIRS).toContain('components')
    // Ours, Tailwind's own (`@theme` extends rather than replaces), and a
    // project `@utility` — all three must reach the compiler.
    expect(findDeadUtilities('text-gray-900 text-gray-950 bg-bg-warm shadow-lg')).toEqual([])
  })

  it('flags the utilities #176 removed', () => {
    const found = findDeadUtilities(
      'className="font-raleway text-gray-dark border-gray-light"',
    ).map(({ utility }) => utility)

    expect(found).toEqual(['font-raleway', 'text-gray-dark', 'border-gray-light'])
  })

  /**
   * The five the scale-and-`font-*` rule missed. Each is dead for its own
   * reason: a token off a numeric scale, an unread namespace, and a scale name
   * that is simply mistyped.
   */
  it.each([
    ['text-error-light', 'a colour token off a numeric scale'],
    ['bg-accent-soft', 'a colour token off a numeric scale'],
    ['rounded-pill', 'the radius namespace'],
    ['shadow-brand', 'the shadow namespace'],
    ['text-grey-700', 'a mistyped scale name'],
  ])('flags %s — %s', (utility) => {
    expect(findDeadUtilities(`className="${utility}"`).map((d) => d.utility)).toEqual([utility])
  })

  it('accepts a declared token through a variant, an opacity and an important', () => {
    const variant = 'hover:'
    const opacity = '/80'
    const important = '!'

    expect(
      findDeadUtilities(
        `${variant}text-gray-700 bg-teal-500${opacity} ring-offset-teal-900 border-gray-200${important}`,
      ),
    ).toEqual([])
    expect(findDeadUtilities('font-sans font-mono font-number font-semibold')).toEqual([])
  })

  /** A keyword sharing a prefix with a token, which the old rule special-cased. */
  it('accepts a keyword that shares its prefix with a token', () => {
    expect(
      findDeadUtilities('text-center text-balance font-stretch-expanded border-x-2 rounded-full'),
    ).toEqual([])
  })

  /** Out of scope: an arbitrary value names no token, and a slug is not a utility. */
  it('ignores an arbitrary value and a hyphenated slug', () => {
    expect(
      findDeadUtilities('text-[16px] bg-(--surface-tint) how-to-begin my-rounded-thing'),
    ).toEqual([])
  })

  /**
   * Stories are in scope, unlike in the other guards: Ladle renders them, and
   * two of #176's four call sites were stories. Specs are not: the obvious way
   * to test this bug is a fixture spelling a dead class, and the component a
   * spec covers is scanned on its own, so no call site goes unchecked.
   */
  it.each(SCANNED_DIRS)('declares every token the utilities in %s name', (dir) => {
    const files = globSync(`${dir}/**/*.{ts,tsx}`, { cwd: repoRoot }).filter(
      (file) => !/\.test\.tsx?$/.test(file),
    )

    expect(files.length).toBeGreaterThan(0)

    const offences = files.flatMap((file) => {
      const source = readSource(join(repoRoot, file))

      return findDeadUtilities(source).map(
        ({ utility, index }) => `${file}:${lineAt(source, index)} — ${utility}`,
      )
    })

    expect(offences).toEqual([])
  })
})
