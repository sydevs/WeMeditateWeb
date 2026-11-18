/**
 * No hand-rolled `<img>` may leave `loading` unsaid.
 *
 * React 19 hoists a `<link rel="preload" as="image">` for every `<img>`
 * carrying a `src` unless it is `loading="lazy"`, `fetchPriority="low"`, a
 * `data:` URI, or inside a `<picture>` or `<noscript>`. So an author who omits
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
 * An `<img>` with no `src` is not a finding: React hoists nothing without one,
 * which is what makes the narrow rule sufficient. Neither `<picture>` nor
 * `<noscript>` appears in the scan set, so neither needs a carve-out.
 *
 * This reads the parsed tag rather than the source text (`_source-scan.ts`),
 * because an `onError={() => setHasError(true)}` ahead of the `loading` is what
 * a regex would truncate the tag at — `Avatar` spells exactly that.
 *
 * ⚠ It reads the attributes a tag spells itself, so a `<img {...props} />`
 * whose spread carries the `src` is skipped rather than reported. Reporting it
 * would ask an author to annotate correct code, which this guard offers no way
 * to exempt. A pass means "no tag names a src without a loading", not proof
 * that nothing preloads.
 */

import ts from 'typescript'
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { lineOf, parse, repoRoot, sourceFiles, walk } from './_source-scan'

const SOURCE_GLOBS = ['components/**/*.tsx', 'layouts/**/*.tsx', 'pages/**/*.tsx']

/** The attribute names a tag spells itself. A spread contributes none. */
function spelledAttributes(tag: ts.JsxOpeningLikeElement, file: ts.SourceFile): Set<string> {
  return new Set(
    tag.attributes.properties
      .filter(ts.isJsxAttribute)
      .map((attribute) => attribute.name.getText(file)),
  )
}

/** Every `<img src>` in `source` that names no `loading`, by line. */
export function scan(source: string): number[] {
  const file = parse(source)
  const lines: number[] = []

  walk(file, (node) => {
    if (!ts.isJsxOpeningLikeElement(node) || node.tagName.getText(file) !== 'img') return

    const spelled = spelledAttributes(node, file)
    if (!spelled.has('src') || spelled.has('loading')) return

    lines.push(lineOf(file, node.tagName.getStart(file)))
  })

  return lines
}

const SCANNED = sourceFiles(SOURCE_GLOBS)

describe('image loading', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(SCANNED.length).toBeGreaterThan(50)
  })

  it('every raw <img> with a src names its own loading', () => {
    const findings = SCANNED.flatMap((file) =>
      scan(readFileSync(file, 'utf8')).map((line) => `${relative(repoRoot, file)}:${line}`),
    )

    expect(findings).toEqual([])
  })

  it('catches the shape it claims to catch', () => {
    // Proves the matcher actually fires. Without this, a broken one would make
    // the guard above pass forever.
    const eager = ['const a = (', '  <img alt="" src="/x.png" />', ')'].join('\n')
    const multiline = ['const a = (', '  <img', '    alt=""', '    src="/x.png"', '  />', ')'].join(
      '\n',
    )

    expect(scan(eager)).toEqual([2])
    expect(scan(multiline)).toEqual([2])
  })

  it('reads the whole tag, so a > inside a prop value decides nothing', () => {
    // The `Avatar` spelling. A regex ending the tag at the first `>` would
    // report the compliant one and miss the `loading` on the other.
    const compliant = 'const a = <img alt="" src="/x.png" onError={() => reset()} loading="lazy" />'
    const bare = 'const a = <img alt="" src="/x.png" onError={() => reset()} />'

    expect(scan(compliant)).toEqual([])
    expect(scan(bare)).toEqual([1])
  })

  it('passes a lazy img, an eager one, and an img with no src', () => {
    expect(scan('const a = <img alt="" loading="lazy" src="/x.png" />')).toEqual([])
    expect(scan('const a = <img alt="" loading="eager" src="/x.png" />')).toEqual([])
    expect(scan('const a = <img alt="" loading={priority ? "eager" : "lazy"} src={src} />')).toEqual(
      [],
    )
    expect(scan('const a = <img alt="" />')).toEqual([])
  })

  it('leaves the <Image> atom to its own lint selector', () => {
    // `eslint.config.js` holds `<Image>` to an `aspectRatio`; the atom sets
    // `loading` from `priority`, so a call site never spells one.
    expect(scan('const a = <Image alt="" aspectRatio="square" sizes="48px" src="/x.png" />')).toEqual(
      [],
    )
  })
})
