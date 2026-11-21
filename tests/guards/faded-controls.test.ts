/**
 * A control faded out of sight is faded out of the keyboard's way only when
 * its action is unavailable.
 *
 * `opacity-0 pointer-events-none` takes an element out of the pointer flow
 * while it is invisible. The tab order is not pointer flow, so a focusable
 * child keeps its stop and a keyboard lands on something nobody can see —
 * WCAG 2.1 SC 2.4.7. The two fixes are opposites, and which one is right
 * depends on whether the action can still be taken:
 *
 * - **The action is available**, and the fade is chrome over something else.
 *   Restore both properties on `focus-within:`, so the stop becomes visible
 *   when focus arrives. The meditation player's play/pause is this case: it is
 *   the only play/pause a keyboard can reach, so dropping the stop drops the
 *   function (#278).
 * - **The action is unavailable**, so there is nothing to reach. Drop the stop
 *   and the a11y tree with it — `tabIndex` and `aria-hidden` on the same
 *   element. `ContentCarousel`'s arrows are this case: each hides at its end
 *   of the carousel, where it would do nothing.
 *
 * Run it against the source: a fade is a fact about the class list, and jsdom
 * computes no CSS, so neither branch is visible to a render.
 */

import { describe, it, expect } from 'vitest'
import ts from 'typescript'
import { relative } from 'node:path'
import {
  componentGlobs,
  lineAt,
  parse,
  readSource,
  repoRoot,
  sourceFiles,
  walk,
} from './_source-scan'

/**
 * `(?<![\w-])` and `(?![\w-])` keep `opacity-0` off `opacity-05`, and let a
 * variant prefix through: `group-hover:opacity-0` fades just the same.
 */
const FADED = [/(?<![\w-])opacity-0(?![\w-])/, /(?<![\w-])pointer-events-none(?![\w-])/]

/** Both halves, because restoring one without the other hides or inerts the control. */
const RESTORED = [
  /(?<![\w-])focus-within:opacity-100(?![\w-])/,
  /(?<![\w-])focus-within:pointer-events-auto(?![\w-])/,
]

/** Out of the tab order and out of the a11y tree, on the element that fades. */
const WITHDRAWN = ['tabIndex', 'aria-hidden']

function attributes(element: ts.JsxOpeningLikeElement): ts.JsxAttribute[] {
  return element.attributes.properties.filter((property): property is ts.JsxAttribute =>
    ts.isJsxAttribute(property),
  )
}

/**
 * 1-based line numbers of every element in `source` that fades itself without
 * taking either way out.
 */
export function scan(source: string): number[] {
  const file = parse(source)
  const lines: number[] = []

  walk(file, (node) => {
    if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) return

    const attrs = attributes(node)
    const className = attrs.find((attr) => attr.name.getText(file) === 'className')

    // The whole attribute, so a class list built from a ternary is read in full.
    const classes = className?.getText(file) ?? ''

    if (!FADED.every((pattern) => pattern.test(classes))) return
    if (RESTORED.every((pattern) => pattern.test(classes))) return

    const names = new Set(attrs.map((attr) => attr.name.getText(file)))

    if (WITHDRAWN.every((name) => names.has(name))) return

    lines.push(lineAt(source, node.getStart(file)))
  })

  return lines
}

/** Every element in the tree that fades itself, either way out or not. */
function fadedElements(): string[] {
  return sourceFiles(componentGlobs).flatMap((file) => {
    const source = readSource(file)
    const parsed = parse(source)
    const hits: string[] = []

    walk(parsed, (node) => {
      if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) return

      const classes =
        attributes(node)
          .find((attr) => attr.name.getText(parsed) === 'className')
          ?.getText(parsed) ?? ''

      if (FADED.every((pattern) => pattern.test(classes))) {
        hits.push(`${relative(repoRoot, file)}:${lineAt(source, node.getStart(parsed))}`)
      }
    })

    return hits
  })
}

describe('faded controls', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(sourceFiles(componentGlobs).length).toBeGreaterThan(50)
  })

  it('finds the fades it is here to check', () => {
    // A pattern that matched nothing would make the assertion below pass on an
    // empty set, which is the failure this guard exists to prevent.
    expect(fadedElements().length).toBeGreaterThanOrEqual(3)
  })

  it('every faded element either reveals on focus or withdraws its tab stop', () => {
    const findings = sourceFiles(componentGlobs).flatMap((file) =>
      scan(readSource(file)).map((line) => `${relative(repoRoot, file)}:${line}`),
    )

    expect(findings).toEqual([])
  })

  it('catches every spelling it claims to catch', () => {
    const sample = [
      // The defect: faded, and still a tab stop.
      '<div className="opacity-0 pointer-events-none"><button /></div>',
      '<div className={`${hidden ? "opacity-0 pointer-events-none" : "opacity-100"}`} />',
      // Reveal on focus, both halves.
      '<div className="opacity-0 pointer-events-none focus-within:opacity-100 focus-within:pointer-events-auto" />',
      // One half only is still the defect: visible but inert, or operable but unseen.
      '<div className="opacity-0 pointer-events-none focus-within:opacity-100" />',
      '<div className="opacity-0 pointer-events-none focus-within:pointer-events-auto" />',
      // Withdrawn from the tab order and the a11y tree.
      '<Button aria-hidden={!can} className="opacity-0 pointer-events-none" tabIndex={-1} />',
      // Withdrawing only one of the two leaves a stop, or leaves it announced.
      '<Button className="opacity-0 pointer-events-none" tabIndex={-1} />',
      '<Button aria-hidden className="opacity-0 pointer-events-none" />',
      // Not a fade: inert but visible, or invisible but still in the pointer flow.
      '<div className="pointer-events-none" />',
      '<div className="opacity-0" />',
      // A variant prefix still fades it.
      '<div className="group-hover:opacity-0 pointer-events-none" />',
      // Not `opacity-0`.
      '<div className="opacity-05 pointer-events-none" />',
    ]

    expect(sample.map((s) => scan(s).length)).toEqual([1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0])
  })
})
