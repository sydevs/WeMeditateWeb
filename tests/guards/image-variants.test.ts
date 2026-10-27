/**
 * Every `<Image>` call site asks for a variant, and says how wide its box is.
 *
 * `aspectRatio` is what makes the atom resolve a Cloudflare variant at all —
 * without it the URL passes through and the box gets the full-size original.
 * `sizes` is what makes the resulting srcset worth having: the atom's default
 * assumes a roughly full-width layout, so a 48px tile fetched 800px.
 *
 * Both rules were prose on `ImageProps` before this guard, and prose is what
 * failed: fourteen call sites were missing one or the other (#146). The
 * population is small and closed, so the cheap fix is to make the next one a
 * red test rather than a silent 20x over-fetch.
 *
 * A caller that genuinely wants the intrinsic-ratio mode, or the full-width
 * default, belongs in EXEMPT with its reason — not outside the scan.
 */

import { describe, it, expect } from 'vitest'
import { lineAt, readSource, repoRoot, sourceFiles } from './_source-scan'

const GLOBS = ['components/**/*.tsx', 'pages/**/*.tsx', 'layouts/**/*.tsx']

/**
 * Call sites allowed to omit one of the two props, by `<path>:<prop>`.
 *
 * Empty on purpose: every site complies today. An entry here is a decision,
 * so it carries the reason the box cannot say how wide it is.
 */
const EXEMPT: Record<string, string> = {}

/**
 * The text of each `<Image …>` opening tag, with its line.
 *
 * Scanning for the closing `>` has to respect braces and quotes, because a
 * prop value holds both — `sizes="(min-width: 1024px) 400px"` and
 * `aspectRatio={a > b ? 'video' : 'square'}` each contain characters that
 * would end the tag if read naively.
 */
function imageTags(source: string): { tag: string; line: number }[] {
  const tags: { tag: string; line: number }[] = []

  for (const match of source.matchAll(/<Image(?=[\s/>])/g)) {
    const start = match.index
    let depth = 0
    let quote: string | null = null
    let end = start

    for (let i = start; i < source.length; i++) {
      const char = source[i]

      if (quote) {
        if (char === quote) quote = null
        continue
      }
      if (char === '"' || char === "'" || char === '`') {
        quote = char
        continue
      }
      if (char === '{') depth++
      else if (char === '}') depth--
      else if (char === '>' && depth === 0) {
        end = i
        break
      }
    }
    tags.push({ tag: source.slice(start, end), line: lineAt(source, start) })
  }

  return tags
}

/** Every `<Image>` call site missing `prop`, as `<relative path>:<line>`. */
function sitesMissing(prop: 'aspectRatio' | 'sizes'): string[] {
  return sourceFiles(GLOBS).flatMap((file) => {
    const relative = file.slice(repoRoot.length + 1)

    if (EXEMPT[`${relative}:${prop}`]) {
      return []
    }

    return imageTags(readSource(file))
      .filter(({ tag }) => !new RegExp(`\\b${prop}[={]`).test(tag))
      .map(({ line }) => `${relative}:${line}`)
  })
}

describe('every <Image> call site', () => {
  it('passes an aspectRatio, so a Cloudflare URL resolves to a variant', () => {
    expect(sitesMissing('aspectRatio')).toEqual([])
  })

  it('passes an explicit sizes, so the srcset entry matches the box', () => {
    expect(sitesMissing('sizes')).toEqual([])
  })

  // A scan that silently matches nothing fails open, exactly like the lint
  // selectors `jsx-literals.test.ts` guards. So prove it finds the sites.
  it('scans the real call sites, and reads a prop off a multi-line tag', () => {
    const tags = sourceFiles(GLOBS).flatMap((file) => imageTags(readSource(file)))

    expect(tags.length).toBeGreaterThanOrEqual(12)
    expect(tags.every(({ tag }) => tag.startsWith('<Image'))).toBe(true)
    // The TechniqueCard tag spans several lines and its `sizes` holds a `>`-free
    // media query with its own parentheses and quotes.
    expect(
      tags.some(({ tag }) => tag.includes('sizes=') && tag.includes('(min-width: 1024px)')),
    ).toBe(true)
  })
})
