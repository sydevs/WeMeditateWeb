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
 */

import { describe, it, expect } from 'vitest'
import { globSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const SOURCE_GLOBS = ['components/**/*.tsx', 'layouts/**/*.tsx', 'pages/**/*.tsx']

/**
 * `aria-label="…"`, `aria-label={'…'}` and `` aria-label={`…`} `` whose value
 * contains a letter. A label that is only punctuation or an interpolation is
 * not prose, so it is not a translation.
 */
const ARIA_LABEL_LITERAL = /aria-label=(?:"([^"]*)"|\{\s*'([^']*)'\s*\}|\{\s*`([^`$]*)`\s*\})/g

/** An `sr-only` element whose child text is a literal, not an expression. */
const SR_ONLY_LITERAL = /className="[^"]*\bsr-only\b[^"]*"[^>]*>\s*([A-Za-z][^<{]*)</g

const HAS_LETTER = /\p{L}/u

/** Blanks comments, keeping newlines, so a JSDoc example is not a finding. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(
      /(^|[^:])\/\/[^\n]*/g,
      (match, lead: string) => lead + ' '.repeat(match.length - lead.length),
    )
}

function sourceFiles(): string[] {
  return SOURCE_GLOBS.flatMap((pattern) =>
    globSync(pattern, { cwd: repoRoot })
      .map((file) => join(repoRoot, file))
      // Stories and tests supply their own fixture copy on purpose.
      .filter((file) => !file.endsWith('.stories.tsx') && !file.endsWith('.test.tsx')),
  )
}

/** Every hardcoded screen-reader string, as `file:line → text`. */
export function findA11yLiterals(): string[] {
  const findings: string[] = []

  for (const file of sourceFiles()) {
    const source = stripComments(readFileSync(file, 'utf8'))
    const at = (index: number) => source.slice(0, index).split('\n').length

    for (const pattern of [ARIA_LABEL_LITERAL, SR_ONLY_LITERAL]) {
      pattern.lastIndex = 0

      for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
        const text = (match[1] ?? match[2] ?? match[3] ?? '').trim()

        if (text.length > 0 && HAS_LETTER.test(text)) {
          findings.push(`${relative(repoRoot, file)}:${at(match.index)} → ${text}`)
        }
      }
    }
  }

  return findings
}

describe('screen-reader strings', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(sourceFiles().length).toBeGreaterThan(50)
  })

  it('no aria-label or sr-only text is a hardcoded literal', () => {
    expect(findA11yLiterals()).toEqual([])
  })

  it('reports a literal it is given, with its location', () => {
    // Proves the patterns actually match. Without this, a broken regex
    // would make the guard above pass forever.
    const sample = [
      '<button aria-label="Dismiss" />',
      "<button aria-label={'Close'} />",
      '<span className="sr-only">Loading</span>',
      // Not findings: a resolved call, and a label with no letters.
      "<button aria-label={t('common.a11y.dismiss')} />",
      '<button aria-label="—" />',
    ].join('\n')

    const found = [ARIA_LABEL_LITERAL, SR_ONLY_LITERAL].flatMap((pattern) => {
      pattern.lastIndex = 0
      const hits: string[] = []

      for (let match = pattern.exec(sample); match; match = pattern.exec(sample)) {
        const text = (match[1] ?? match[2] ?? match[3] ?? '').trim()

        if (text.length > 0 && HAS_LETTER.test(text)) hits.push(text)
      }

      return hits
    })

    expect(found.sort()).toEqual(['Close', 'Dismiss', 'Loading'])
  })
})
