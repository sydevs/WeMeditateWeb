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
 * This reads the prop's presence, not its value, so it cannot see a caller
 * that forwards `sizes={sizes}` and is handed `undefined` — `ContentCard` does
 * exactly that, and its grid callers still fall back to the atom's default
 * (#206). A scan has no way to reach them; only a type can.
 *
 * There is no exemption list on purpose. A caller that genuinely wants the
 * intrinsic-ratio mode, or the full-width default, has to edit this guard to
 * say so, which puts the reason in front of a reviewer at the moment it is
 * claimed. An earlier draft keyed exemptions by file and skipped the whole
 * file, so exempting one tag silently un-guarded its siblings.
 */

import { describe, it, expect } from 'vitest'
import { lineAt, readSource, repoRoot, sourceFiles } from './_source-scan'

const GLOBS = ['components/**/*.tsx', 'pages/**/*.tsx', 'layouts/**/*.tsx']

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
