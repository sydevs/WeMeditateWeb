/**
 * No component may ship content that the server's HTML renders invisible.
 *
 * Three components independently gated an element on `opacity-0` until a
 * client load event fired, so their title, body text and image arrived fully
 * transparent from the server and never appeared at all with JavaScript off.
 * A human reading a page found each one (#145, #149), and each fix brought a
 * per-component SSR test — which covers the components someone remembered and
 * nothing else.
 *
 * Run it against the source, not a render: a first-render `opacity-0` is a
 * fact about the code, so this catches it in a component no test happens to
 * render. `a11y-literals.test.ts` reads the source for the same reason.
 *
 * **Two conditions, because neither alone discriminates.** Every legitimate
 * reveal — a hover overlay, an accordion, a carousel arrow — is also a flag
 * that starts off before load, so condition 1 on its own flags six
 * affordances for every real bug. A site is reported only when
 *
 * 1. the first render can select the `opacity-0` arm, **and**
 * 2. the file wires a load event — `onLoad`, `onError`, or an `img.complete`
 *    check.
 *
 * That second count is 7 in `Image.tsx` and 0 in every other file holding an
 * `opacity-0`, so the two conditions separate the bugs from the affordances by
 * themselves and this guard grants no exemptions. A per-site exemption would
 * be one chance per affordance to wave a real bug through.
 *
 * A flag whose initial value is not findable in the same file is **skipped**
 * rather than reported: `MeditationPlayer.tsx` reads `state.isPlaying` off
 * `useAudioPlayer`, and a member of a hook's return is not a fact about the
 * line that uses it. An in-file expression that may take either value is
 * reported, so `useState(!hasImageSrc)` is not waved through. That skip is
 * this guard's one known false negative, bounded by the per-component SSR
 * specs asserting the rendered side.
 *
 * ⚠ It matches text, not syntax, so its coverage is the two shapes below
 * rather than every possible one. A pass means "none of the covered
 * spellings", never proof that the server's markup is visible.
 */

import { describe, it, expect } from 'vitest'
import { relative } from 'node:path'
import { blank, lineAt, readSource, repoRoot, sourceFiles } from './_source-scan'

const SOURCE_GLOBS = ['components/**/*.tsx', 'layouts/**/*.tsx', 'pages/**/*.tsx']

/** Condition 2 — a file-level fact, so it needs no AST. */
const LOAD_EVENT = /\bonLoad\b|\bonError\b|\.complete\b/

/**
 * A bare opacity class, `!`-important or not. A variant-prefixed one —
 * `after:opacity-0`, `hover:after:opacity-100` — styles a pseudo-element or a
 * hover state, never the first render.
 */
const HIDDEN = /(?<![\w:-])opacity-0!?(?![\w-])/
const IMPORTANT_VISIBLE = /(?<![\w:-])opacity-100!(?![\w-])/

/** One arm of a ternary: a string with no interpolation of its own. */
const ARM = String.raw`(?:'([^'\n]*)'|"([^"\n]*)"|\`([^\`$\n]*)\`)`

/**
 * `flag ? 'A' : 'B'`, either polarity — the shape all three bugs took. The
 * condition stops at a brace, a backtick or a newline, which is what keeps it
 * to the one interpolation it lives in.
 */
const CONDITION = String.raw`[^?:;{}=\n\`][^?:;{}=\n\`]*?`
const TERNARY = new RegExp(String.raw`(${CONDITION})\s*\?\s*${ARM}\s*:\s*${ARM}`, 'g')
const ONE_TERNARY = new RegExp(TERNARY.source)

/** A template literal, and the `${…}` holes in one. */
const TEMPLATE = /`[^`]*`/g
const INTERPOLATION = /\$\{(?:[^{}]|\{[^{}]*\})*\}/g

/** An identifier a condition reads, a member path kept whole. */
const IDENTIFIER = /(?<![\w$.])[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/g
const KEYWORD = new Set(['typeof', 'void', 'in', 'instanceof', 'new'])

/** Initialisers whose truthiness is readable off the text. */
const LITERAL_TRUTH = new Map([
  ['true', true],
  ['false', false],
  ['null', false],
  ['undefined', false],
  ['0', false],
  ["''", false],
  ['""', false],
])

/**
 * How `flag` is initialised in this file, or `null` when the file does not
 * bind it — a hook's return, or an import.
 */
function initialExpression(source: string, flag: string): string | null {
  const bindings = [
    // `useState<Set<string>>` puts a `>` inside the type argument, so that
    // cannot be delimited by one.
    String.raw`\[\s*${flag}\s*,[^\]\n]*\]\s*=\s*useState(?:<[^(]*>)?\(\s*((?:[^()\n]|\([^()\n]*\))*?)\s*\)`,
    // A prop default, inline or one per line.
    String.raw`[{,]\s*${flag}\s*=\s*([^,}\n]+)`,
    String.raw`\b(?:const|let|var)\s+${flag}\s*(?::[^=\n]*)?=\s*([^\n]+)`,
  ]

  for (const pattern of bindings) {
    const match = new RegExp(pattern).exec(source)
    if (match) return match[1].trim()
  }

  return null
}

type Truth = boolean | 'either' | 'unknown'

/**
 * Whether `condition` holds on the first render. `'either'` means the file
 * binds every flag it reads, but to an expression, so both arms are
 * reachable. `'unknown'` means a flag comes from outside the file.
 */
function firstRenderTruth(source: string, condition: string): Truth {
  const negated = condition.startsWith('!')
  const bare = condition.replace(/^!\s*/, '')

  if (/^[A-Za-z_$][\w$]*$/.test(bare)) {
    const initial = initialExpression(source, bare)
    if (initial === null) return 'unknown'

    const literal = LITERAL_TRUTH.get(initial)
    if (literal === undefined) return 'either'

    return negated ? !literal : literal
  }

  // A member path or a compound condition resolves only as far as the flags it
  // reads, and one flag from outside the file decides the whole condition.
  const identifiers = (bare.match(IDENTIFIER) ?? []).filter((name) => !KEYWORD.has(name))
  if (identifiers.length === 0) return 'unknown'

  for (const identifier of identifiers) {
    if (identifier.includes('.')) return 'unknown'
    if (LITERAL_TRUTH.has(identifier)) continue
    if (initialExpression(source, identifier) === null) return 'unknown'
  }

  return 'either'
}

function arm(match: RegExpExecArray | RegExpMatchArray, first: number): string {
  return match[first] ?? match[first + 1] ?? match[first + 2] ?? ''
}

/**
 * The second shape: a static `opacity-0` whose only un-hiding is an
 * interpolated `!`-important override. A ternary matcher cannot see it, and
 * the next bug could take it.
 */
function scanStaticOverride(source: string): { line: number; detail: string }[] {
  const findings: { line: number; detail: string }[] = []

  for (const template of source.matchAll(TEMPLATE)) {
    const hiddenAt = blank(template[0], INTERPOLATION).search(HIDDEN)
    if (hiddenAt < 0) continue

    for (const hole of template[0].matchAll(INTERPOLATION)) {
      const match = ONE_TERNARY.exec(hole[0])
      if (!match) continue

      const override = {
        consequent: IMPORTANT_VISIBLE.test(arm(match, 2)),
        alternate: IMPORTANT_VISIBLE.test(arm(match, 5)),
      }
      if (!override.consequent && !override.alternate) continue

      const truth = firstRenderTruth(source, match[1].trim())
      if (truth === 'unknown') continue

      // The static class is in the markup unless the override wins the first
      // render outright.
      const unhidden = truth === 'either' ? false : truth ? override.consequent : override.alternate
      if (unhidden) continue

      findings.push({
        line: lineAt(source, (template.index ?? 0) + hiddenAt),
        detail: 'a static opacity-0 is un-hidden only by an interpolated override',
      })
      break
    }
  }

  return findings
}

/** Every site in `source` both conditions catch, as `line → detail`. */
export function scan(source: string): { line: number; detail: string }[] {
  if (!LOAD_EVENT.test(source)) return []

  const findings: { line: number; detail: string }[] = []

  TERNARY.lastIndex = 0
  for (let match = TERNARY.exec(source); match; match = TERNARY.exec(source)) {
    const hidden = { consequent: HIDDEN.test(arm(match, 2)), alternate: HIDDEN.test(arm(match, 5)) }
    if (!hidden.consequent && !hidden.alternate) continue

    const condition = match[1].trim()
    const truth = firstRenderTruth(source, condition)
    if (truth === 'unknown') continue

    const reachable =
      truth === 'either'
        ? hidden.consequent || hidden.alternate
        : truth
          ? hidden.consequent
          : hidden.alternate
    if (!reachable) continue

    findings.push({
      line: lineAt(source, match.index + match[0].indexOf('?')),
      detail: `${condition} can select opacity-0 on the first render`,
    })
  }

  return [...findings, ...scanStaticOverride(source)].sort((a, b) => a.line - b.line)
}

describe('server-rendered visibility', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(sourceFiles(SOURCE_GLOBS).length).toBeGreaterThan(50)
  })

  it('no component hides its first render behind a load event', () => {
    const findings = sourceFiles(SOURCE_GLOBS).flatMap((file) =>
      scan(readSource(file)).map((f) => `${relative(repoRoot, file)}:${f.line} → ${f.detail}`),
    )

    expect(findings).toEqual([])
  })

  it('catches both shapes it claims to catch', () => {
    // Proves the patterns actually match. Without this, a broken regex would
    // make the guard above pass forever.
    const ternary = [
      'const [isLoading, setIsLoading] = useState(true)',
      "const a = <img onLoad={load} className={`${isLoading ? 'opacity-0' : 'opacity-100'}`} />",
    ].join('\n')
    const mirrored = [
      'const [isLoading, setIsLoading] = useState(false)',
      "const a = <img onLoad={load} className={`${isLoading ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')
    const staticOverride = [
      'const [isActive, setIsActive] = useState(false)',
      "const a = <img onLoad={load} className={`opacity-0 invisible ${isActive ? 'opacity-100! visible!' : ''}`} />",
    ].join('\n')

    expect(scan(ternary).map((f) => f.line)).toEqual([2])
    expect(scan(mirrored).map((f) => f.line)).toEqual([2])
    expect(scan(staticOverride).map((f) => f.line)).toEqual([2])
  })

  it('reports an in-file expression that may take either value', () => {
    // The `ContentCard` gate #153 removed. `!hasImageSrc` is not a literal, so
    // reading "resolve" as "resolve to a literal" would skip the one shape the
    // guard exists for.
    const sample = [
      'const hasImageSrc = thumbnailSrc.length > 0',
      'const [imageLoaded, setImageLoaded] = useState(!hasImageSrc)',
      "const a = <img onLoad={load} className={`${imageLoaded ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')

    expect(scan(sample).map((f) => f.line)).toEqual([3])
  })

  it('resolves a prop default, so an inverted-polarity gate passes', () => {
    // `SplashLoader`: `isLoading` starts true, which selects the visible arm. A
    // direction-blind matcher would flag it.
    const sample = [
      'export function SplashLoader({ color = "primary", isLoading = true }: Props) {',
      "  return <img onLoad={load} className={`${isLoading ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')

    expect(scan(sample)).toEqual([])
  })

  it('resolves a derived alias rather than skipping it', () => {
    // `Header`: `isSticky` is an alias, not state. It is bound in the file, so
    // it is read as reachable rather than waved through as unresolvable.
    const sample = [
      'const [isScrolledPast, setIsScrolledPast] = useState(false)',
      'const isSticky = condensed || isScrolledPast',
      "const a = <img onLoad={load} className={`${isSticky ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')

    expect(scan(sample).map((f) => f.line)).toEqual([3])
  })

  it('skips a flag whose initial value is not in the file', () => {
    // `MeditationPlayer` reads these off `useAudioPlayer`.
    const sample = [
      'const [state, controls] = useAudioPlayer({ url })',
      "const a = <img onLoad={load} className={`${!state.isPlaying || state.isLoading ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')

    expect(scan(sample)).toEqual([])
  })

  it('passes an affordance, a static affordance and an un-hidden override', () => {
    const noLoadEvent = [
      'const [isHovered, setIsHovered] = useState(false)',
      "const a = <div className={`${isHovered ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')
    const pseudoElement =
      'const a = <img onLoad={load} className={`after:opacity-0 hover:after:opacity-100`} />'
    const visibleFirst = [
      'const [isActive, setIsActive] = useState(true)',
      "const a = <img onLoad={load} className={`opacity-0 ${isActive ? 'opacity-100!' : ''}`} />",
    ].join('\n')

    expect(scan(noLoadEvent)).toEqual([])
    expect(scan(pseudoElement)).toEqual([])
    expect(scan(visibleFirst)).toEqual([])
  })
})
