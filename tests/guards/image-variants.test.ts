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
 *
 * It reads `<Image>` tags only, and four of the ten sites #146 fixed are a
 * hand-rolled `<img>`. Holding those to `getImageURL` needs the exemption
 * list this guard refuses: of the eight raw `<img>` the last test pins, only
 * two name the helper in the tag — the atom's own `<img>` is the pipeline,
 * one paints a bundled SVG, and two reach the helper a hop away. The two that
 * really do pass an unsized URL are `ContentOverlay` and `AtlasContent`, both
 * #150's, so that arm goes green there rather than here.
 */

import { describe, it, expect } from 'vitest'
import { lineAt, readSource, repoRoot, sourceFiles } from './_source-scan'

const GLOBS = ['components/**/*.tsx', 'pages/**/*.tsx', 'layouts/**/*.tsx']

/**
 * The text of each `<name …>` opening tag, with its line.
 *
 * Scanning for the closing `>` has to respect braces and quotes, because a
 * prop value holds both — `sizes="(min-width: 1024px) 400px"` and
 * `aspectRatio={a > b ? 'video' : 'square'}` each contain characters that
 * would end the tag if read naively.
 */
function tags(source: string, name: 'Image' | 'img'): { tag: string; line: number }[] {
  const found: { tag: string; line: number }[] = []

  for (const match of source.matchAll(new RegExp(`<${name}(?=[\\s/>])`, 'g'))) {
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
    found.push({ tag: source.slice(start, end), line: lineAt(source, start) })
  }

  return found
}

/** Every file in the scan set, as its repo-relative path and stripped source. */
function scanned(): { path: string; source: string }[] {
  return sourceFiles(GLOBS).map((file) => ({
    path: file.slice(repoRoot.length + 1),
    source: readSource(file),
  }))
}

/** Every `<Image>` call site missing `prop`, as `<relative path>:<line>`. */
function sitesMissing(prop: 'aspectRatio' | 'sizes'): string[] {
  return scanned().flatMap(({ path, source }) =>
    tags(source, 'Image')
      .filter(({ tag }) => !new RegExp(`\\b${prop}[={]`).test(tag))
      .map(({ line }) => `${path}:${line}`),
  )
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
    const sites = scanned().flatMap(({ source }) => tags(source, 'Image'))

    expect(sites.length).toBeGreaterThanOrEqual(12)
    expect(sites.every(({ tag }) => tag.startsWith('<Image'))).toBe(true)
    // The TechniqueCard tag spans several lines and its `sizes` holds a `>`-free
    // media query with its own parentheses and quotes.
    expect(
      sites.some(({ tag }) => tag.includes('sizes=') && tag.includes('(min-width: 1024px)')),
    ).toBe(true)
  })
})

// The docstring's reason for stopping at `<Image>` rests on a measurement, and
// a measurement nothing checks is the defect this guard exists to catch. So
// pin the raw population instead: a new hand-rolled `<img>` is a red test and
// a decision — does its `src` reach `getImageURL`? — rather than a silent
// eleventh over-fetch outside the scan.
describe('every raw <img>', () => {
  it('is one of the sites the docstring accounts for', () => {
    const sites = scanned().flatMap(({ path, source }) => tags(source, 'img').map(() => path))

    expect(sites.sort()).toEqual([
      'components/atoms/Avatar/Avatar.tsx',
      'components/atoms/Image/Image.tsx',
      'components/molecules/VideoPlayer/index.tsx',
      'components/organisms/ContentOverlay/ContentOverlay.tsx',
      'components/organisms/MeditationPlayer/MeditationPlayer.tsx',
      'components/organisms/OrnateTextBox/OrnateTextBox.tsx',
      'components/organisms/Splash/Splash.tsx',
      'pages/map/_components/AtlasContent.tsx',
    ])
  })
})
