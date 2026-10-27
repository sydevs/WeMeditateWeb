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
 * Tailwind decides the **reach** too, for the colour namespace: a root takes a
 * colour exactly when `<root>-<a declared colour token>` compiles. So the list
 * follows a version bump on its own, and covers roots a hand-written one missed
 * (`mask-*-from`, `scrollbar-thumb`, `border-x`).
 *
 * Three shapes are deliberately out of scope. An arbitrary value (`text-[16px]`,
 * `bg-(--var)`) names no token, a match preceded by `<word>-` is a slug rather
 * than a utility — `how-to-begin` is not a gradient stop — and a match followed
 * by `:` or `=` is CSS rather than a class.
 */

import { describe, it, expect } from 'vitest'
import { globSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { __unstable__loadDesignSystem } from 'tailwindcss'
import {
  repoRoot,
  readSource,
  lineAt,
  blank,
  layoutsDir,
  loadTailwindStylesheet,
  themeStylesheet,
} from './_source-scan'

/** `@source "../components";` — the inline form declares classes, not paths. */
const SCANNED_DIRS = [...themeStylesheet.matchAll(/@source\s+"\.\.\/([^"]+)"/g)].map(
  ([, dir]) => dir,
)

const designSystem = await __unstable__loadDesignSystem(themeStylesheet, {
  base: layoutsDir,
  loadStylesheet: loadTailwindStylesheet,
})

/**
 * Probed with a declared colour token rather than hand-listed. Probing the
 * other namespaces this way does not work: an ambiguous value like `lg`
 * compiles under `w-`, `blur-` and `basis-` too, so `font` and `rounded` are
 * named instead.
 */
const WATCHED_PREFIXES = ((): string[] => {
  const sample = /--color-([a-z0-9-]+):/.exec(themeStylesheet)?.[1]
  const roots = designSystem.utilities.keys('functional')
  const compiled = designSystem.candidatesToCss(roots.map((root) => `${root}-${sample}`))

  return [...roots.filter((_, i) => compiled[i] !== null), 'font', 'rounded']
})()

/**
 * Longest root first, so `mask-x-from` wins over the `from` it contains. A
 * variant prefix is dropped rather than matched: it cannot make a dead utility
 * live, or a live one dead. A trailing `/50` opacity and `!` important belong
 * to the candidate, so the compiler is handed both.
 *
 * The token must open and close on an alphanumeric, and nothing class-shaped
 * may follow it. That is what keeps an interpolated `` `bg-teal-${step}` `` out:
 * matched loosely it yields `bg-teal-`, or `bg-teal` on a retry, and neither is
 * a utility anyone wrote.
 *
 * A `:` or `=` next is the other exclusion, and it covers the larger surface:
 * 44 kebab-case CSS property names sit under a watched root and compile to
 * nothing, `stroke-width` and `font-family` among them. A declaration, an
 * arbitrary property (`[stroke-width:2px]`) and an SVG attribute all put a
 * separator straight after the name; a class never has one there.
 */
const CANDIDATE = new RegExp(
  `(?<![a-z0-9-])(?:${[...WATCHED_PREFIXES]
    .sort((a, b) => b.length - a.length)
    .join('|')})-[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:/[a-z0-9.]+)?!?(?![a-z0-9:=-])`,
  'g',
)

interface DeadUtility {
  readonly utility: string
  readonly index: number
}

/**
 * The two regions where a component writes CSS rather than classes. An inline
 * `<style>` block is a stylesheet, so `stroke-width` there is a property name;
 * `AnimatedLogoSvg` is the one such block. A `style` prop holds CSS values, and
 * `border-box`, `text-top` and `text-bottom` sit under watched roots — React
 * spells the keys beside them in camelCase, so no class can be in there.
 *
 * Non-greedy to the first `}}`, which can only end the prop early: a `}}` the
 * object does not close cannot exist before the one that closes it.
 */
const CSS_REGIONS = [/<style\b[^>]*>[\s\S]*?<\/style>/g, /\bstyle=\{\{[\s\S]*?\}\}/g]

/**
 * Blanks both, here rather than in `_source-scan`: the other guards read a file
 * and never a bare string, while `findDeadUtilities` is handed both, so the
 * strip has to sit with the matcher to apply in either case.
 */
function stripCss(source: string): string {
  return CSS_REGIONS.reduce(blank, source)
}

/** Every watched utility in `source` that the real stylesheet compiles to nothing. */
function findDeadUtilities(source: string): DeadUtility[] {
  const found = [...stripCss(source).matchAll(CANDIDATE)].map((match) => ({
    utility: match[0],
    index: match.index,
  }))
  const css = designSystem.candidatesToCss(found.map(({ utility }) => utility))

  return found.filter((_, i) => css[i] === null)
}

const utilitiesIn = (source: string): string[] =>
  findDeadUtilities(source).map(({ utility }) => utility)

describe('theme utilities', () => {
  it('compiles against the real stylesheet', () => {
    expect(SCANNED_DIRS).toContain('components')
    expect(WATCHED_PREFIXES).toContain('ring-offset')
    // Ours, Tailwind's own (`@theme` extends rather than replaces), and a
    // project `@utility` — all three must reach the compiler.
    expect(utilitiesIn('text-gray-900 text-gray-950 bg-bg-warm text-glow-light')).toEqual([])
  })

  it('flags the utilities #176 removed', () => {
    expect(utilitiesIn('className="font-raleway text-gray-dark border-gray-light"')).toEqual([
      'font-raleway',
      'text-gray-dark',
      'border-gray-light',
    ])
  })

  /**
   * The five the scale-and-`font-*` rule missed: a colour token off a numeric
   * scale (twice), two namespaces it never read, and a mistyped scale name.
   */
  it('flags a dead token in any namespace', () => {
    expect(
      utilitiesIn('text-error-light bg-accent-soft rounded-pill shadow-brand text-grey-700'),
    ).toEqual(['text-error-light', 'bg-accent-soft', 'rounded-pill', 'shadow-brand', 'text-grey-700'])
  })

  it('accepts a declared token through a variant, an opacity and an important', () => {
    expect(
      utilitiesIn('hover:text-gray-700 bg-teal-500/80 ring-offset-teal-900 border-gray-200!'),
    ).toEqual([])
  })

  /** A keyword sharing a prefix with a token, which the old rule special-cased. */
  it('accepts a keyword that shares its prefix with a token', () => {
    expect(
      utilitiesIn(
        'text-center text-balance font-stretch-expanded border-x-2 rounded-full font-sans font-number',
      ),
    ).toEqual([])
  })

  /** Out of scope: an arbitrary value names no token, and a slug is not a utility. */
  it('ignores an arbitrary value and a hyphenated slug', () => {
    expect(utilitiesIn('text-[16px] bg-(--surface-tint) how-to-begin my-rounded-thing')).toEqual([])
  })

  it('ignores a CSS property and an attribute name', () => {
    expect(
      utilitiesIn('stroke-width: 3px; [stroke-width:2px] font-family="Raleway" text-align=center'),
    ).toEqual([])
  })

  it('ignores a CSS value in a style prop', () => {
    expect(
      utilitiesIn("<div style={{ boxSizing: 'border-box', verticalAlign: 'text-top' }} />"),
    ).toEqual([])
  })

  /** A class held as an object value is still a class, so `: '` is not CSS. */
  it('flags a dead token in a variant map', () => {
    expect(utilitiesIn("const styles = { error: 'bg-error-light text-error-light' }")).toEqual([
      'bg-error-light',
      'text-error-light',
    ])
  })

  /**
   * `source(none)` turns a harmless failure — extra CSS ships — into a silent
   * one: a directory outside the scan set compiles no classes at all, and the
   * symptom is an unstyled element on first render. So the set is checked
   * against the tree rather than only described in prose.
   *
   * Bounded to `.ts`/`.tsx`, as the rest of this file is. `.claude` is ignored
   * because `git worktree add .claude/worktrees/<slug>` puts a whole second
   * checkout there, which `globSync` walks and `.gitignore` does not stop.
   */
  it('scans every directory that authors a class', () => {
    const ignored = new Set(['node_modules', 'dist', 'build', '.git', '.claude'])
    const roots = readdirSync(repoRoot, { withFileTypes: true })
      .filter((entry) => !entry.isDirectory() || !ignored.has(entry.name))
      .map((entry) => (entry.isDirectory() ? `${entry.name}/**/*.{ts,tsx}` : entry.name))

    const authoring = roots.filter((pattern) =>
      globSync(pattern, { cwd: repoRoot })
        .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
        .some((file) => readSource(join(repoRoot, file)).includes('className')),
    )

    expect(authoring.filter((pattern) => !SCANNED_DIRS.includes(pattern.split('/')[0]))).toEqual([])
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
