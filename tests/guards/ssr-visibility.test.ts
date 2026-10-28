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
 * render. A `no-restricted-syntax` selector cannot take its place, because the
 * verdict needs a flag's initialiser resolved from elsewhere in the file, and
 * no single-node selector reaches that far.
 *
 * **Two conditions, because neither alone discriminates.** Every legitimate
 * reveal — a hover overlay, an accordion, a carousel arrow — is also a flag
 * that starts off before load, so condition 1 on its own finds affordances and
 * nothing else. A site is reported only when
 *
 * 1. the first render can select the `opacity-0` arm, **and**
 * 2. the file wires a load event — `onLoad`, `onError`, or an `img.complete`
 *    check.
 *
 * An affordance never waits on a load event and a fade-in gate must, so the
 * pair separates them without naming a single site. A per-site exemption would
 * be one chance per affordance to wave a real bug through.
 *
 * Two gaps are deliberate, and neither has a live site to point at:
 *
 * - A flag whose initial value is not findable in the same file is skipped
 *   rather than reported — a member of a hook's return is not a fact about the
 *   line that uses it. #154 decision 3 chose this, so the guard never asks an
 *   author to annotate correct code. An in-file expression that may take either
 *   value is still reported, so `useState(!hasImageSrc)` is not waved through.
 * - The static-plus-override shape is matched pre-emptively. `SubtleSystem` is
 *   the only component written that way and it wires no load event, so that
 *   shape earns its code as one the next bug could take unseen, not by catching
 *   anything today.
 *
 * ⚠ It matches text, not syntax, so its coverage is the two shapes below rather
 * than every possible one. A pass means "none of the covered spellings", never
 * proof that the server's markup is visible.
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
const ARM = String.raw`('[^'\n]*'|"[^"\n]*"|\`[^\`$\n]*\`)`

/**
 * `flag ? 'A' : 'B'`, either polarity — the shape all three bugs took. The
 * condition stops at a brace, a backtick or a newline, which is what keeps it
 * to the one interpolation it lives in.
 */
const CONDITION = String.raw`[^?:;{}=\n\`][^?:;{}=\n\`]*?`
const TERNARY = new RegExp(String.raw`(${CONDITION})\s*\?\s*${ARM}\s*:\s*${ARM}`, 'g')

/** The same pattern without `g`, so the two scans cannot share a `lastIndex`. */
const ONE_TERNARY = new RegExp(TERNARY.source)

/** A template literal, and the `${…}` holes in one. */
const TEMPLATE = /`[^`]*`/g
const INTERPOLATION = /\$\{(?:[^{}]|\{[^{}]*\})*\}/g

/** An identifier a condition reads, a member path kept whole. */
const IDENTIFIER = /(?<![\w$.])[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*/g

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

interface Finding {
  line: number
  detail: string
}

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
 * binds every flag it reads, but to an expression, so both arms are reachable.
 * `'unknown'` means a flag comes from outside the file.
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
  const identifiers = bare.match(IDENTIFIER) ?? []
  if (identifiers.length === 0) return 'unknown'

  for (const identifier of identifiers) {
    if (identifier.includes('.')) return 'unknown'
    if (LITERAL_TRUTH.has(identifier)) continue
    if (initialExpression(source, identifier) === null) return 'unknown'
  }

  return 'either'
}

type Arm = 'consequent' | 'alternate'

/** The arms the first render can select. */
function reachableArms(truth: Exclude<Truth, 'unknown'>): readonly Arm[] {
  if (truth === 'either') return ['consequent', 'alternate']

  return truth ? ['consequent'] : ['alternate']
}

/**
 * The second shape: a static `opacity-0` whose only un-hiding is an
 * interpolated `!`-important override.
 */
function scanStaticOverride(source: string): Finding[] {
  const findings: Finding[] = []

  for (const template of source.matchAll(TEMPLATE)) {
    const hiddenAt = blank(template[0], INTERPOLATION).search(HIDDEN)
    if (hiddenAt < 0) continue

    for (const hole of template[0].matchAll(INTERPOLATION)) {
      const match = ONE_TERNARY.exec(hole[0])
      if (!match) continue

      const override = {
        consequent: IMPORTANT_VISIBLE.test(match[2]),
        alternate: IMPORTANT_VISIBLE.test(match[3]),
      }
      if (!override.consequent && !override.alternate) continue

      const truth = firstRenderTruth(source, match[1].trim())
      if (truth === 'unknown') continue

      // The static class stays in the markup unless the override wins every
      // arm the first render can take.
      if (reachableArms(truth).every((which) => override[which])) continue

      findings.push({
        line: lineAt(source, template.index + hiddenAt),
        detail: 'a static opacity-0 is un-hidden only by an interpolated override',
      })
      break
    }
  }

  return findings
}

/** Every site in `source` both conditions catch. */
export function scan(source: string): Finding[] {
  if (!LOAD_EVENT.test(source)) return []

  const findings: Finding[] = []

  TERNARY.lastIndex = 0
  for (let match = TERNARY.exec(source); match; match = TERNARY.exec(source)) {
    const hidden = { consequent: HIDDEN.test(match[2]), alternate: HIDDEN.test(match[3]) }
    if (!hidden.consequent && !hidden.alternate) continue

    const condition = match[1].trim()
    const truth = firstRenderTruth(source, condition)
    if (truth === 'unknown') continue
    if (!reachableArms(truth).some((which) => hidden[which])) continue

    findings.push({
      line: lineAt(source, match.index + match[0].indexOf('?')),
      detail: `${condition} can select opacity-0 on the first render`,
    })
  }

  return [...findings, ...scanStaticOverride(source)].sort((a, b) => a.line - b.line)
}

const lines = (source: string): number[] => scan(source).map((f) => f.line)

describe('server-rendered visibility', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(sourceFiles(SOURCE_GLOBS).length).toBeGreaterThan(50)
  })

  it('finds files wiring a load event (condition 2 is not vacuously false)', () => {
    // Narrowing LOAD_EVENT to a spelling nothing uses would silently reduce the
    // guard's real coverage to nothing while every fixture below stayed green.
    const wired = sourceFiles(SOURCE_GLOBS).filter((file) => LOAD_EVENT.test(readSource(file)))

    expect(wired.length).toBeGreaterThan(0)
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

    expect(lines(ternary)).toEqual([2])
    expect(lines(mirrored)).toEqual([2])
    expect(lines(staticOverride)).toEqual([2])
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

    expect(lines(sample)).toEqual([3])
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

    expect(lines(sample)).toEqual([3])
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
