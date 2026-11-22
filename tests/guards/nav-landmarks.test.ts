/**
 * Every `<nav>` carries an accessible name.
 *
 * A page here opens up to six navigation landmarks — the header nav, a mega
 * dropdown, breadcrumbs, a table of contents, and three footer link lists. A
 * screen reader lists them all under one name unless each says which it is, so
 * "navigation, navigation, navigation" is the whole menu structure (axe
 * `landmark-unique`). Three were unnamed when this landed (#278).
 *
 * Run it against the source, not the render: a landmark is a fact about the
 * code, and the next nav is added in a component no test happens to render.
 * `sourceFiles` drops stories and specs, which open unnamed demo navs on
 * purpose.
 */

import { describe, it, expect } from 'vitest'
import { relative } from 'node:path'
import { componentGlobs, lineAt, readSource, repoRoot, sourceFiles } from './_source-scan'

/**
 * An opening `<nav>` tag through to its `>`, so the attributes are in the
 * match. `[^>]*` stops at the first `>`, which an attribute value cannot hold
 * outside a brace expression — and a `>` inside one belongs to a JSX child or
 * a comparison, neither of which can precede the name this looks for.
 */
const NAV = /<nav(?=[\s/>])[^>]*>/g

/** Either way of naming a landmark. */
const NAMED = /\baria-label(?:ledby)?[\s]*=/

/** 1-based line numbers of every unnamed `<nav>` opened in `source`. */
export function scan(source: string): number[] {
  const lines: number[] = []

  NAV.lastIndex = 0
  for (let match = NAV.exec(source); match; match = NAV.exec(source)) {
    if (!NAMED.test(match[0])) lines.push(lineAt(source, match.index))
  }

  return lines
}

describe('nav landmarks', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(sourceFiles(componentGlobs).length).toBeGreaterThan(50)
  })

  it('finds the navs it is here to check', () => {
    // A regex that matched nothing would make the assertion below pass on an
    // empty tree, which is the failure this guard exists to prevent.
    const withNav = sourceFiles(componentGlobs).filter((file) => {
      NAV.lastIndex = 0

      return NAV.test(readSource(file))
    })

    expect(withNav.length).toBeGreaterThanOrEqual(6)
  })

  it('every <nav> under components/, layouts/ and pages/ is named', () => {
    const findings = sourceFiles(componentGlobs).flatMap((file) =>
      scan(readSource(file)).map((line) => `${relative(repoRoot, file)}:${line}`),
    )

    expect(findings).toEqual([])
  })

  it('catches every spelling it claims to catch', () => {
    const sample = [
      '<nav className="x">',
      '<nav\n  className="x"\n>',
      '<nav aria-label="Main">',
      "<nav aria-label={t('common.a11y.primary_navigation')}>",
      '<nav aria-labelledby="heading-id">',
      '<navigation />',
    ]

    expect(sample.map((s) => scan(s).length)).toEqual([1, 1, 0, 0, 0, 0])
  })
})
