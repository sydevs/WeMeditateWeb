/**
 * Normal-size text that names a scale step outright must clear the 4.5:1 of
 * WCAG 2.1 SC 1.4.3.
 *
 * `layouts/tailwind.test.ts` covers the surface tokens, which are one
 * declaration each. This guard covers the other half, the steps a component
 * spells itself: a filled button looks the same on every surface, so `Button`
 * names its fill and its label as steps, and a raw `text-gray-*` anywhere is
 * read against white — `--color-bg-warm` is declared with no call site, which
 * `blockConverters.test.tsx` asserts, so white is the only light background.
 *
 * It reads class strings rather than rendered components, because the pair that
 * matters is a fill and a label *of one variant*, which only the variant map
 * puts side by side. #179 moved the pairings that failed here.
 *
 * Its reach is one line: a `className` run is written on one, so a background
 * named two elements up is invisible to it. That is the blind spot, and it is
 * why `Button`'s maps are read on their own above.
 */

import { describe, it, expect } from 'vitest'

import { contrast, isColor } from '../_helpers/contrast'
import { repoRoot, readSource, sourceFiles } from './_source-scan'

const BUTTON = readSource(`${repoRoot}/components/atoms/Button/Button.tsx`)

/**
 * Exempt pairings, as `<path>:<text step>`. Each would read as a defect here,
 * and none is one.
 */
const EXEMPT = new Map([
  // A brand mark, not text: the `square` and `circle` variants render only
  // `LogoSvg`, and a logotype carries no contrast requirement.
  ['components/atoms/graphics/Logo/Logo.tsx:white', 'logotype'],
  // `aria-hidden` number badges, which no reader reaches: incidental text.
  ['components/organisms/TechniqueCard/TechniqueCard.tsx:gray-400', 'decorative'],
  // Drawn only under `surface === 'dark'`, on the dark ground this file paints.
  ['components/ladle/StorySection.tsx:gray-100', 'dark surface'],
])

/**
 * Every `<variant>: '<classes>'` row of `Button`'s two variant maps, as the
 * fill, label and hover steps it names. A `bg-transparent` or a surface-token
 * label belongs to the surface specs, so a row missing either side is skipped.
 */
function filledVariants(): { variant: string; fill: string; label: string }[] {
  const rows: { variant: string; fill: string; label: string }[] = []

  for (const [, variant, classes] of BUTTON.matchAll(/^\s{4}(\w+):\s*'([^']*)',$/gm)) {
    const label = classes.match(/\btext-(gray-\d+|white)\b/)?.[1]
    const fills = [...classes.matchAll(/(?:^|\s)(?:hover:|active:)?(?:after:)?bg-([a-z]+-\d+)\b/g)]

    if (!label || fills.length === 0) continue

    for (const [, fill] of fills) rows.push({ variant, fill, label })
  }

  return rows
}

/** `bg-teal-700`, and the `hover:` or `after:` form, but never `bg-teal-700/40`. */
const GROUNDS = /\b(?:hover:|active:|group-hover:|after:)?bg-([a-z]+(?:-\d+)?)(?=[\s'"`}]|$)/g

interface Offence {
  readonly file: string
  readonly row: number
  readonly text: string
  readonly ground: string
}

/**
 * Every text/background pairing under 4.5:1 that `pattern` finds as text on a
 * line of `files`. A line naming no background falls back to white, which is
 * what the page paints.
 *
 * An opacity modifier is left out of `GROUNDS` on purpose: `bg-error/10`
 * composites to something this cannot resolve, and white is the closer stand-in
 * for a tint that faint.
 */
function offences(files: string[], pattern: RegExp): Offence[] {
  return files.flatMap((path) => {
    const file = path.slice(repoRoot.length + 1)
    const source = readSource(path)

    return source.split('\n').flatMap((line, index) => {
      const texts = [...line.matchAll(pattern)]
        .map(([, step]) => step)
        .filter((step) => isColor(step) && !EXEMPT.has(`${file}:${step}`))

      if (texts.length === 0) return []

      const named = [...line.matchAll(GROUNDS)].map(([, ground]) => ground).filter(isColor)
      const grounds = named.length > 0 ? named : ['white']

      return texts.flatMap((text) =>
        grounds
          .filter((ground) => contrast(text, ground) < 4.5)
          .map((ground) => ({ file, row: index + 1, text, ground })),
      )
    })
  })
}

const report = (found: Offence[]): string[] =>
  found.map(
    ({ file, row, text, ground }) =>
      `${file}:${row} — text-${text} on ${ground} (${contrast(text, ground).toFixed(2)}:1)`,
  )

/** Stories supply their own fixture copy, so `sourceFiles` leaves them out. */
const COMPONENTS = sourceFiles(['components/**/*.tsx', 'pages/**/*.tsx', 'layouts/**/*.tsx'])
const VARIANTS = filledVariants()

describe('text contrast', () => {
  // `it.each` over an empty list creates no test and reports nothing, so the
  // count is what makes a parse failure visible.
  it('reads both of Button’s variant maps', () => {
    expect(VARIANTS.map(({ variant }) => variant)).toEqual(
      expect.arrayContaining(['primary', 'secondary']),
    )
    // Two maps, three fill steps each for primary and secondary.
    expect(VARIANTS.length).toBeGreaterThanOrEqual(12)
  })

  it.each(VARIANTS)('clears 4.5:1 for a $variant label ($label on $fill)', ({ fill, label }) => {
    expect(contrast(label, fill)).toBeGreaterThanOrEqual(4.5)
  })

  // `gray-700` measured 4.23:1 on white, and `gray-500` 2.33, so a grey below
  // `gray-800` cannot carry text at all. A fill named beside it only lowers
  // that: `gray-800` clears the bar on `gray-200` (5.29) but not `gray-300`.
  it('names no grey under the bar for text', () => {
    expect(report(offences(COMPONENTS, /\btext-(gray-\d+)\b/g))).toEqual([])
  })

  // A component that paints its own fill and its own label on one line owes the
  // pair, whatever scale either names — `Playlist`'s current track drew white on
  // `teal-600` (3.85) the way the primary button did.
  it('clears 4.5:1 for a label on a fill it names itself', () => {
    const pattern = /\btext-([a-z]+(?:-\d+)?)(?=[\s'"`}]|$)/g
    const found = offences(COMPONENTS, pattern).filter(
      // A line naming no fill is the grey check's business, above: `text-white`
      // there sits on a surface the line does not name.
      ({ ground }) => ground !== 'white',
    )

    expect(report(found)).toEqual([])
  })
})
