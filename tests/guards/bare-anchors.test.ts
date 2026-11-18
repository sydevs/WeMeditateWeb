/**
 * No component may open an `<a>` element. The `Link` atom is the one anchor.
 *
 * `Link` is where a locale prefix is added (`localeHref`) and where an href
 * the site did not author is scheme-gated (`isSafeLinkHref`). An anchor
 * written by hand skips both, and the failure is silent in English: the page
 * looks right while every French reader lands on the English document. Four
 * components drifted past the prose rule that way (#258), and two of the four
 * were latent for months because no production caller passed an href yet.
 *
 * Run it against the source, not the render: an anchor is a fact about the
 * code, and this catches one in a component no test happens to render.
 *
 * It lives here rather than in `eslint.config.js` because that file's
 * `no-restricted-syntax` block is one rule id shared with the translations
 * selectors, so exempting the atom would switch those off in the same file.
 * A guard also strips comments, so it never sees an `eslint-disable`: the
 * allowlist below is the whole exemption list, in one place, with reasons.
 */

import { describe, it, expect } from 'vitest'
import { relative } from 'node:path'
import { lineAt, readSource, repoRoot, sourceFiles } from './_source-scan'

const SOURCE_GLOBS = ['components/**/*.tsx', 'layouts/**/*.tsx', 'pages/**/*.tsx']

/**
 * An opening `<a>` tag. The lookahead is what keeps `<animate>` and `<area>`
 * out, and `sourceFiles` already drops stories and specs, which render their
 * own demo anchors.
 */
const ANCHOR = /<a(?=[\s/>])/g

/** Repo-relative paths that may open one, and why each is allowed to. */
const ALLOWED: Record<string, string> = {
  'components/atoms/Link/Link.tsx':
    'the atom itself — this is the anchor every call site routes through',
  'components/molecules/ErrorFallback/ErrorFallback.tsx':
    'isSafeHttpUrl proves the status-page URL absolute before it renders, so there is no locale to add',
}

/** 1-based line numbers of every `<a>` opened in `source`. */
export function scan(source: string): number[] {
  const lines: number[] = []

  ANCHOR.lastIndex = 0
  for (let match = ANCHOR.exec(source); match; match = ANCHOR.exec(source)) {
    lines.push(lineAt(source, match.index))
  }

  return lines
}

describe('bare anchors', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(sourceFiles(SOURCE_GLOBS).length).toBeGreaterThan(50)
  })

  it('only the Link atom and the named exceptions open one', () => {
    const findings = sourceFiles(SOURCE_GLOBS).flatMap((file) => {
      const path = relative(repoRoot, file)

      return path in ALLOWED ? [] : scan(readSource(file)).map((line) => `${path}:${line}`)
    })

    expect(findings).toEqual([])
  })

  it('every allowed path still exists, and still opens one', () => {
    // An entry kept after its anchor is gone is an exemption nobody is using,
    // and the next hand-written anchor in that file inherits it silently.
    for (const path of Object.keys(ALLOWED)) {
      expect(scan(readSource(`${repoRoot}/${path}`))).not.toEqual([])
    }
  })

  it('catches every spelling it claims to catch', () => {
    // Without this, a broken regex would make the guard above pass forever.
    const sample = ['<a href="/x">y</a>', '<a\n  href={href}\n>', '<a />', '<animate /><area />']

    expect(sample.map((s) => scan(s).length)).toEqual([1, 1, 1, 0])
  })
})
