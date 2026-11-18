/**
 * No hand-rolled `<img>` may leave `loading` unsaid.
 *
 * React 19 hoists a `<link rel="preload" as="image">` for every `<img>`
 * carrying a `src` **or a `srcSet`** unless it is `loading="lazy"`,
 * `fetchPriority="low"`, a `data:` URI, or inside a `<picture>` or
 * `<noscript>`. Both halves are measured against `react-dom@19.3.1`: a
 * `srcSet` with no `src` preloads too, which is the shape `VideoPlayer`'s
 * fallback is one attribute away from. So an author who omits
 * the attribute preloads the image whether or not the page wants it — the
 * regression #142, #145 and #150 each fixed one site at a time, with nothing
 * stopping the next one. The `Image` atom decides this from its `priority`
 * prop; a hand-rolled `<img>` has nothing deciding it.
 *
 * **An explicit `loading`, whatever its value, and no exemption list.** Every
 * raw `<img>` here is either below the fold or a route's LCP image, so a list
 * of the eager ones would have to be edited whenever a hero moves, and a stale
 * entry asserts nothing. `loading="eager"` at the call site says the same
 * thing beside the code it describes.
 *
 * **Why not the `no-restricted-syntax` selector `<Image>` uses** (#207). The
 * selector is equivalent on today's tree — measured, not assumed — and faults
 * in the editor, which a spec cannot. It is also silenceable: an
 * `eslint-disable no-restricted-syntax` region, the spelling AGENTS.md tells
 * an author to write for untranslated copy, turns it off for every selector
 * in reach. A guard reading the source cannot be silenced one site at a time,
 * which is the same reason `a11y-literals.test.ts` stays a guard.
 *
 * Neither `<picture>` nor `<noscript>` appears in the scan set, so neither
 * needs a carve-out.
 *
 * ⚠ Three gaps, all deliberate. It reads the attributes a tag spells itself, so
 * a `<img {...props} />` whose spread carries the `src` is skipped rather than
 * reported — reporting it would ask an author to annotate correct code, which
 * this guard offers no way to exempt. It reads presence, not value, so
 * `loading={loading}` handed `undefined` passes here and preloads anyway —
 * measured, and the trap `eslint.config.js` records for `sizes` as #206, where
 * the answer was a type requirement rather than a source rule. And
 * `sourceFiles` drops stories, so the raw `<img>` in `SplashLoader.stories.tsx`
 * is out of scope along with every other playground fixture.
 */

import ts from 'typescript'
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { componentGlobs, repoRoot, sourceFiles } from './_source-scan'
import { lineOf, parse, walk } from './_syntax-scan'

/** Every `<img>` in `source` React would preload, by line. */
export function scan(source: string): number[] {
  const file = parse(source)
  const lines: number[] = []

  walk(file, (node) => {
    if (!ts.isJsxOpeningLikeElement(node) || node.tagName.getText(file) !== 'img') return

    // A spread contributes no name, which is the first ⚠ gap above.
    const spells = (name: string) =>
      node.attributes.properties.some(
        (property) => ts.isJsxAttribute(property) && property.name.getText(file) === name,
      )

    if ((!spells('src') && !spells('srcSet')) || spells('loading')) return

    lines.push(lineOf(file, node.tagName.getStart(file)))
  })

  return lines
}

const SCANNED = sourceFiles(componentGlobs)

describe('image loading', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(SCANNED.length).toBeGreaterThan(50)
  })

  it('every raw <img> React would preload names its own loading', () => {
    const findings = SCANNED.flatMap((file) =>
      scan(readFileSync(file, 'utf8')).map((line) => `${relative(repoRoot, file)}:${line}`),
    )

    expect(findings).toEqual([])
  })

  it('catches the shape it claims to catch', () => {
    // Proves the matcher actually fires. Without this, a broken one would make
    // the guard above pass forever.
    const unsaid = ['const a = (', '  <img alt="" src="/x.png" />', ')'].join('\n')
    const multiline = ['const a = (', '  <img', '    alt=""', '    src="/x.png"', '  />', ')'].join(
      '\n',
    )
    // React preloads a srcSet with no src too, so a src-only rule fails open
    // on the shape the `VideoPlayer` fallback is one attribute away from.
    const srcSetOnly = 'const a = <img alt="" sizes="100vw" srcSet={ladder} />'

    expect(scan(unsaid)).toEqual([2])
    expect(scan(multiline)).toEqual([2])
    expect(scan(srcSetOnly)).toEqual([1])
  })

  it('reads the whole tag, so a > inside a prop value decides nothing', () => {
    // The `Avatar` spelling. A regex ending the tag at the first `>` would
    // report the compliant one and miss the `loading` on the other.
    const compliant = 'const a = <img alt="" src="/x.png" onError={() => reset()} loading="lazy" />'
    const bare = 'const a = <img alt="" src="/x.png" onError={() => reset()} />'

    expect(scan(compliant)).toEqual([])
    expect(scan(bare)).toEqual([1])
  })

  it('passes a lazy img, an eager one, and an img React would not preload', () => {
    expect(scan('const a = <img alt="" loading="lazy" src="/x.png" />')).toEqual([])
    expect(scan('const a = <img alt="" loading="eager" src="/x.png" />')).toEqual([])
    expect(
      scan('const a = <img alt="" loading={priority ? "eager" : "lazy"} src={src} />'),
    ).toEqual([])
    expect(scan('const a = <img alt="" loading="lazy" sizes="100vw" srcSet={ladder} />')).toEqual(
      [],
    )
    expect(scan('const a = <img alt="" />')).toEqual([])
  })
})
