/**
 * Every Tailwind utility in the scan set must name a token the theme declares.
 *
 * A utility naming an undeclared token compiles to nothing, and nothing warns:
 * no build error, no lint error, no failing test. #176 found four of them —
 * `font-raleway`, `text-gray-dark`, `border-gray-light` — and two were visible,
 * because v4 defaults `border-color` and an SVG `fill` to `currentColor`, so the
 * element took the inherited text colour instead of the grey it asked for.
 *
 * It reads the scan set out of the stylesheet's own `@source` lines, so the
 * guard covers exactly what Tailwind covers.
 */

import { describe, it, expect } from 'vitest'
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { repoRoot, readSource, lineAt } from './_source-scan'

const stylesheet = readFileSync(join(repoRoot, 'layouts', 'tailwind.css'), 'utf8')

/** `@source "../components";` — the inline form declares classes, not paths. */
const SCANNED_DIRS = [...stylesheet.matchAll(/@source\s+"\.\.\/([^"]+)"/g)].map(([, dir]) => dir)

const declaredTokens = (namespace: string): Set<string> =>
  new Set(
    [...stylesheet.matchAll(new RegExp(`--${namespace}-([a-z0-9-]+):`, 'gi'))].map(
      ([, name]) => name,
    ),
  )

const COLORS = declaredTokens('color')
const FONT_WEIGHTS = declaredTokens('font-weight')
/** `--font-weight-*` matches `--font-*` too, so subtract it back out. */
const FONT_FAMILIES = new Set(
  [...declaredTokens('font')].filter((name) => !name.startsWith('weight-')),
)

/**
 * A colour scale's name, for every token ending in a numeric step: `gray` from
 * `--color-gray-900`. A step is what a typo lands on — `gray-dark` names a real
 * scale and no step — so the scale set is what makes the typo detectable.
 */
const SCALES = new Set(
  [...COLORS].flatMap((token) => {
    const scale = token.replace(/-\d+$/, '')

    return scale === token ? [] : [scale]
  }),
)

/** Tailwind's own `@theme` still supplies these; ours extends it, never replaces it. */
const BUILTIN_FONT_FAMILIES = ['sans', 'serif', 'mono']
const BUILTIN_FONT_WEIGHTS = [
  'thin',
  'extralight',
  'light',
  'normal',
  'medium',
  'semibold',
  'bold',
  'extrabold',
  'black',
]

export interface DeadUtility {
  readonly utility: string
  readonly index: number
}

/**
 * Every utility in `source` naming a token the theme does not declare.
 *
 * Colours are matched by scale rather than by utility prefix, so the check
 * covers `text-`, `border-`, `ring-offset-` and anything else without an
 * allowlist to keep current. A trailing `/50` opacity or `!` important is part
 * of the utility, not of the token, so neither is captured.
 */
export function findDeadUtilities(source: string): DeadUtility[] {
  const dead: DeadUtility[] = []

  for (const scale of SCALES) {
    for (const match of source.matchAll(new RegExp(`\\b${scale}-([a-z0-9]+)`, 'g'))) {
      if (!COLORS.has(`${scale}-${match[1]}`)) {
        dead.push({ utility: match[0], index: match.index })
      }
    }
  }

  for (const match of source.matchAll(/\bfont-([a-z][a-z0-9-]*)\b/g)) {
    const name = match[1]

    if (name.startsWith('stretch-')) continue
    const known =
      FONT_FAMILIES.has(name) ||
      FONT_WEIGHTS.has(name) ||
      BUILTIN_FONT_FAMILIES.includes(name) ||
      BUILTIN_FONT_WEIGHTS.includes(name)

    if (!known) dead.push({ utility: match[0], index: match.index })
  }

  return dead
}

describe('theme utilities', () => {
  it('parses the scan set and the theme out of the stylesheet', () => {
    expect(SCANNED_DIRS).toContain('components')
    expect(SCALES).toContain('gray')
    expect(COLORS).toContain('gray-900')
    expect(FONT_FAMILIES).toContain('sans')
  })

  it('flags the utilities #176 removed', () => {
    const found = findDeadUtilities(
      'className="font-raleway text-gray-dark border-gray-light"',
    ).map(({ utility }) => utility)

    expect(found).toEqual(expect.arrayContaining(['font-raleway', 'gray-dark', 'gray-light']))
  })

  it('accepts the declared tokens, with variants, opacity and important', () => {
    expect(
      findDeadUtilities('hover:text-gray-700 bg-teal-500/80 ring-offset-teal-900 border-gray-200!'),
    ).toEqual([])
    expect(findDeadUtilities('font-sans font-mono font-number font-semibold')).toEqual([])
  })

  it.each(SCANNED_DIRS)('declares every token the utilities in %s name', (dir) => {
    const files = globSync(`${dir}/**/*.{ts,tsx}`, { cwd: repoRoot })

    const offences = files.flatMap((file) => {
      const source = readSource(join(repoRoot, file))

      return findDeadUtilities(source).map(
        ({ utility, index }) => `${file}:${lineAt(source, index)} — ${utility}`,
      )
    })

    expect(offences).toEqual([])
  })
})
