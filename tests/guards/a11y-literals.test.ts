/**
 * No screen-reader-only string may be an English literal.
 *
 * The visible copy on a page is obvious when it stops being translated —
 * someone sees it. A hardcoded `aria-label` is not: the page looks entirely
 * correct in French while every button announces itself in English. That is
 * what made the original 41-site inventory (#56) necessary, and this guard
 * is what stops it coming back a literal at a time.
 *
 * Run it against the source, not the render: a literal is a fact about the
 * code, and this catches it in a component no test happens to render.
 *
 * ⚠ It matches text, not syntax, so its coverage is the spellings below
 * rather than every possible one. `aria-label={SOME_CONST}` passes, and
 * `alt` is not covered. Moving this to an ESLint `no-restricted-syntax`
 * selector would make it AST-accurate; until then, treat a pass as "none of
 * the common spellings", not as proof.
 */

import { describe, it, expect } from 'vitest'
import { relative } from 'node:path'
import { lineAt, readSource, repoRoot, sourceFiles } from './_source-scan'

const SOURCE_GLOBS = ['components/**/*.tsx', 'layouts/**/*.tsx', 'pages/**/*.tsx']

/**
 * A quoted string inside an `aria-label`: `="…"`, `={'…'}`, `` ={`…`} ``,
 * and either arm of `={cond ? 'A' : 'B'}` — the last is the shape this PR
 * removed from `VolumeRow`, so the guard has to see it.
 */
// The braced form allows one level of nesting, so a params object —
// `{t('media.a11y.play_item', { title })}` — is captured whole rather than
// truncated at the inner brace.
const ARIA_LABEL = /aria-label=(?:"([^"]*)"|\{((?:[^{}]|\{[^{}]*\})*)\})/g
const QUOTED = /(?:'([^']*)'|"([^"]*)"|`([^`$]*)`)/g

/**
 * A resolved lookup — `t('a.b.c')`, `t.rich('a.b.c')`, `errorTitleKey(…)`.
 * The quoted key inside one is an identifier, not prose, so it is removed
 * before the expression is searched for literals.
 */
const RESOLVED_CALL = /\bt(?:\.rich)?\(\s*(['"])[^'"]*\1(?:\s*,(?:[^()]|\([^()]*\))*)?\)/g

/** An `sr-only` element whose child text is a literal, not an expression. */
const SR_ONLY_LITERAL = /className="[^"]*\bsr-only\b[^"]*"[^>]*>\s*([A-Za-z][^<{]*)</g

const HAS_LETTER = /\p{L}/u

function isProse(text: string): boolean {
  return text.trim().length > 0 && HAS_LETTER.test(text)
}

/** Every hardcoded screen-reader string in `source`, as `line → text`. */
export function scan(source: string): { line: number; text: string }[] {
  const findings: { line: number; text: string }[] = []

  ARIA_LABEL.lastIndex = 0
  for (let match = ARIA_LABEL.exec(source); match; match = ARIA_LABEL.exec(source)) {
    // A double-quoted attribute is prose directly; a braced expression is
    // searched for quoted strings, so a ternary of two literals is caught.
    const texts =
      match[1] !== undefined
        ? [match[1]]
        : [...(match[2] ?? '').replace(RESOLVED_CALL, '').matchAll(QUOTED)].map(
            (q) => q[1] ?? q[2] ?? q[3] ?? '',
          )

    for (const text of texts) {
      if (isProse(text)) findings.push({ line: lineAt(source, match.index), text: text.trim() })
    }
  }

  SR_ONLY_LITERAL.lastIndex = 0
  for (let match = SR_ONLY_LITERAL.exec(source); match; match = SR_ONLY_LITERAL.exec(source)) {
    if (isProse(match[1])) {
      findings.push({ line: lineAt(source, match.index), text: match[1].trim() })
    }
  }

  return findings
}

describe('screen-reader strings', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(sourceFiles(SOURCE_GLOBS).length).toBeGreaterThan(50)
  })

  it('no aria-label or sr-only text is a hardcoded literal', () => {
    const findings = sourceFiles(SOURCE_GLOBS).flatMap((file) =>
      scan(readSource(file)).map((f) => `${relative(repoRoot, file)}:${f.line} → ${f.text}`),
    )

    expect(findings).toEqual([])
  })

  it('catches every spelling it claims to catch', () => {
    // Proves the patterns actually match. Without this, a broken regex
    // would make the guard above pass forever.
    const sample = [
      '<button aria-label="Dismiss" />',
      "<button aria-label={'Close'} />",
      '<span className="sr-only">Loading</span>',
      "<button aria-label={muted ? 'Unmute voice' : 'Mute voice'} />",
    ].join('\n')

    expect(scan(sample).map((f) => f.text).sort()).toEqual([
      'Close',
      'Dismiss',
      'Loading',
      'Mute voice',
      'Unmute voice',
    ])
  })

  it('passes a resolved call and a label with no words', () => {
    const sample = [
      "<button aria-label={t('common.a11y.dismiss')} />",
      '<button aria-label="—" />',
      '<span className="sr-only">{t(\'map.a11y.when\')}</span>',
    ].join('\n')

    expect(scan(sample)).toEqual([])
  })
})
