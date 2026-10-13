/**
 * Every Tailwind utility in the scan set must name a token the theme declares.
 *
 * A utility naming an undeclared token compiles to no CSS, and nothing says so:
 * not the build, not the linter, not the suite. #176's dead classes were visible
 * all the same, because v4 defaults a border colour and an SVG `fill` to
 * `currentColor`, so the element silently took the inherited text colour.
 *
 * The theme to check against is ours *plus* Tailwind's own, because `@theme`
 * extends the default rather than replacing it: `gray-950` still resolves, from
 * `tailwindcss/theme.css`, though `layouts/tailwind.css` stops at `gray-900`.
 * Reading both is also what keeps the check free of a hand-copied list of
 * Tailwind's defaults, which a version bump would rot.
 *
 * Nothing here spells a working utility outright. Tailwind scans this file too,
 * so a literal in a fixture or a comment would ship its CSS to every page.
 */

import { describe, it, expect } from 'vitest'
import { globSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { repoRoot, readSource, lineAt, themeStylesheet } from './_source-scan'

const upstream = createRequire(import.meta.url).resolve('tailwindcss/theme.css')
const THEME = `${themeStylesheet}\n${readFileSync(upstream, 'utf8')}`

/** `@source "../components";` — the inline form declares classes, not paths. */
const SCANNED_DIRS = [...themeStylesheet.matchAll(/@source\s+"\.\.\/([^"]+)"/g)].map(
  ([, dir]) => dir,
)

const declaredTokens = (namespace: string): Set<string> =>
  new Set(
    [...THEME.matchAll(new RegExp(`--${namespace}-([a-z0-9-]+):`, 'gi'))].map(([, name]) => name),
  )

const COLORS = declaredTokens('color')
/** `--font-weight-*` matches `--font-*` too, and `font-` utilities take both. */
const FONTS = new Set([...declaredTokens('font')].map((name) => name.replace(/^weight-/, '')))

/**
 * A colour scale's name, for every token ending in a numeric step: `gray` from
 * `--color-gray-900`. A step is what a typo lands on — `gray-dark` names a real
 * scale and no step — so the scale set is what makes the typo detectable.
 */
const SCALES = new Set([...COLORS].flatMap((token) => /^(.+)-\d+$/.exec(token)?.[1] ?? []))

/**
 * Matched by scale rather than by utility prefix, so one pattern covers `text-`,
 * `bg-`, `border-`, `ring-offset-` and whatever comes next, with no allowlist of
 * prefixes to keep current.
 */
const SCALE_STEP = new RegExp(`\\b(${[...SCALES].join('|')})-([a-z0-9]+)`, 'g')

interface DeadUtility {
  readonly utility: string
  readonly index: number
}

/**
 * Every utility in `source` naming a token the theme does not declare. A
 * trailing `/50` opacity or `!` important belongs to the utility rather than to
 * the token, so neither is captured.
 */
function findDeadUtilities(source: string): DeadUtility[] {
  const dead: DeadUtility[] = []

  for (const match of source.matchAll(SCALE_STEP)) {
    if (!COLORS.has(`${match[1]}-${match[2]}`)) dead.push({ utility: match[0], index: match.index })
  }

  for (const match of source.matchAll(/\bfont-([a-z][a-z0-9-]*)\b/g)) {
    // `font-stretch-*` takes a percentage keyword, not a `--font-*` token.
    if (match[1].startsWith('stretch-')) continue
    if (!FONTS.has(match[1])) dead.push({ utility: match[0], index: match.index })
  }

  return dead
}

describe('theme utilities', () => {
  it('parses both themes out of CSS', () => {
    expect(SCANNED_DIRS).toContain('components')
    expect(COLORS).toContain('gray-900') // ours
    expect(COLORS).toContain('gray-950') // Tailwind's, and still resolvable
    expect(FONTS).toContain('number') // ours
    expect(FONTS).toContain('serif') // Tailwind's
    expect(SCALES.size).toBeGreaterThan(3)
  })

  it('flags the utilities #176 removed', () => {
    const found = findDeadUtilities(
      'className="font-raleway text-gray-dark border-gray-light"',
    ).map(({ utility }) => utility)

    expect(found).toEqual(expect.arrayContaining(['font-raleway', 'gray-dark', 'gray-light']))
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
