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
 * no single-node selector reaches that far. `ts.createSourceFile` is a
 * syntax-only parse — no program, no type checker — so it costs a parse per
 * file and reaches the initialiser directly.
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
 * Condition 2 is read per file, not per element: a load event and the gate it
 * drives often sit in different components of one file, and pairing them by
 * element would miss that. Give `HeaderDropdown` or `Accordion` a load event
 * for some unrelated reason and its existing reveal is reported. The verdict on
 * that site is then this guard's to change, never an exemption's.
 *
 * One gap is deliberate: a flag whose initial value the file does not bind —
 * a hook's return, or an import — is skipped rather than reported. #154
 * decision 3 chose this, so the guard never asks an author to annotate correct
 * code. An in-file expression that may take either value is still reported, so
 * `useState(!hasImageSrc)` is not waved through.
 *
 * ⚠ The two shapes below are its whole coverage. A third — `flag &&
 * 'opacity-0'`, with no arm to compare — is not matched, and the class names
 * inside an arm are read as text, so a variant-prefixed `md:opacity-0` is out
 * of scope. A pass means "neither covered shape", never proof that the
 * server's markup is visible.
 */

import ts from 'typescript'
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { repoRoot, sourceFiles } from './_source-scan'

const SOURCE_GLOBS = ['components/**/*.tsx', 'layouts/**/*.tsx', 'pages/**/*.tsx']

/** Condition 2 — the names that wire a load event. */
const LOAD_HANDLERS = new Set(['onLoad', 'onError'])

/**
 * A bare opacity class, `!`-important or not. Any variant prefix at all puts it
 * out of scope — `after:` and `hover:` because they style a pseudo-element or a
 * hover state rather than the first render, but `md:` and `dark:` along with
 * them, which the ⚠ caveat covers rather than this pattern.
 */
const HIDDEN = /(?<![\w:-])opacity-0!?(?![\w-])/
const IMPORTANT_VISIBLE = /(?<![\w:-])opacity-100!(?![\w-])/

interface Finding {
  line: number
  detail: string
}

type Truth = boolean | 'either' | 'unknown'
type Arm = 'consequent' | 'alternate'

/** `setParentNodes`, because every resolution below walks up from a use site. */
function parse(source: string): ts.SourceFile {
  return ts.createSourceFile('scan.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

const lineOf = (file: ts.SourceFile, position: number): number =>
  file.getLineAndCharacterOfPosition(position).line + 1

/** Condition 2 — a load event wired anywhere in the file. */
function wiresLoadEvent(file: ts.SourceFile): boolean {
  let wired = false

  walk(file, (node) => {
    if (ts.isIdentifier(node) && LOAD_HANDLERS.has(node.text)) wired = true
    if (ts.isPropertyAccessExpression(node) && node.name.text === 'complete') wired = true
  })

  return wired
}

function unwrap(expression: ts.Expression): ts.Expression {
  let node = expression

  while (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node)
  ) {
    node = node.expression
  }

  return node
}

/** The truth readable off a literal, or `null` when the expression is not one. */
function literalTruth(expression: ts.Expression): boolean | null {
  if (expression.kind === ts.SyntaxKind.TrueKeyword) return true
  if (expression.kind === ts.SyntaxKind.FalseKeyword) return false
  if (expression.kind === ts.SyntaxKind.NullKeyword) return false
  if (ts.isIdentifier(expression) && expression.text === 'undefined') return false
  if (ts.isNumericLiteral(expression)) return Number(expression.text) !== 0

  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text !== ''
  }

  return null
}

/** The declaration node binding `name` inside a destructuring pattern. */
function bindingFor(name: string, target: ts.BindingName, owner: ts.Node): ts.Node | null {
  if (ts.isIdentifier(target)) return target.text === name ? owner : null

  for (const element of target.elements) {
    if (ts.isOmittedExpression(element)) continue

    const hit = bindingFor(name, element.name, element)
    if (hit) return hit
  }

  return null
}

/**
 * The nearest binding of `name` in scope at `from`, or `null` when the file
 * does not bind it at all. Walking the scope chain rather than the file is what
 * keeps a flag of the same name in a sibling component from deciding this one —
 * `ContentIndex.tsx` holds five components and `MeditationPlayer.tsx` four.
 */
function findBinding(name: string, from: ts.Node): ts.Node | null {
  for (let node: ts.Node | undefined = from; node; node = node.parent) {
    if (ts.isFunctionLike(node)) {
      for (const parameter of node.parameters) {
        const hit = bindingFor(name, parameter.name, parameter)
        if (hit) return hit
      }
    }

    if (!ts.isSourceFile(node) && !ts.isBlock(node) && !ts.isModuleBlock(node)) continue

    for (const statement of node.statements) {
      if (!ts.isVariableStatement(statement)) continue

      for (const declaration of statement.declarationList.declarations) {
        const hit = bindingFor(name, declaration.name, declaration)
        if (hit) return hit
      }
    }
  }

  return null
}

/** The `useState` argument a `[flag, setFlag]` element destructures. */
function useStateArgument(element: ts.BindingElement): ts.Expression | null {
  const pattern = element.parent
  if (!ts.isArrayBindingPattern(pattern) || pattern.elements.indexOf(element) !== 0) return null

  const declaration = pattern.parent
  if (!ts.isVariableDeclaration(declaration)) return null

  const initializer = declaration.initializer
  if (!initializer || !ts.isCallExpression(initializer)) return null
  if (!ts.isIdentifier(initializer.expression) || initializer.expression.text !== 'useState') {
    return null
  }

  return initializer.arguments[0] ?? null
}

/**
 * What a binding initialises its flag to, or `null` when the file binds the
 * name but not the value — a destructured hook return, or an import.
 */
function initialExpression(binding: ts.Node): ts.Expression | null {
  if (ts.isBindingElement(binding)) return binding.initializer ?? useStateArgument(binding)
  if (ts.isVariableDeclaration(binding) || ts.isParameter(binding)) {
    return binding.initializer ?? null
  }

  return null
}

/**
 * The identifier a read starts from — `useImageLoad` in `useImageLoad(src)`,
 * `openItems` in `openItems.has(id)`. Whether that one name is bound here is
 * what makes the read a fact about this file.
 */
function rootIdentifier(expression: ts.Expression): ts.Identifier | null {
  let node = unwrap(expression)

  while (
    ts.isCallExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node)
  ) {
    node = unwrap(node.expression)
  }

  return ts.isIdentifier(node) ? node : null
}

/**
 * The truth an initialiser carries. A read rooted outside the file is the shape
 * decision 3 skips: a hook's return is not a fact about the line using it. Any
 * other in-file expression may take either value, which is the shape the guard
 * exists for — the `useState(!hasImageSrc)` gate #153 removed. That is why an
 * operand is never resolved here: `hasImageSrc` is derived from a prop, so
 * resolving it would skip the one site the guard was written for.
 */
function initialTruth(initial: ts.Expression, at: ts.Node, seen: ReadonlySet<string>): Truth {
  const expression = unwrap(initial)

  if (ts.isArrowFunction(expression) && !ts.isBlock(expression.body)) {
    return initialTruth(expression.body, at, seen)
  }

  const literal = literalTruth(expression)
  if (literal !== null) return literal

  if (ts.isIdentifier(expression)) return flagTruth(expression.text, at, seen)

  if (
    ts.isCallExpression(expression) ||
    ts.isPropertyAccessExpression(expression) ||
    ts.isElementAccessExpression(expression)
  ) {
    const root = rootIdentifier(expression)
    if (!root) return 'unknown'

    return flagTruth(root.text, at, seen) === 'unknown' ? 'unknown' : 'either'
  }

  return 'either'
}

/** Whether `flag` holds on the first render, resolved from its binding. */
function flagTruth(flag: string, at: ts.Node, seen: ReadonlySet<string>): Truth {
  if (seen.has(flag)) return 'unknown'

  const binding = findBinding(flag, at)
  if (!binding) return 'unknown'

  const initial = initialExpression(binding)
  if (!initial) return 'unknown'

  return initialTruth(initial, binding, new Set(seen).add(flag))
}

/**
 * Whether `condition` holds on the first render. `'either'` means the file
 * binds every flag it reads, but to an expression, so both arms are reachable.
 * `'unknown'` means a value comes from outside the file.
 *
 * A comparison's operands are resolved, never evaluated: `condensed ||
 * isScrolledPast` reads `'either'` and is reported, which is #154's verdict 2.
 * A call or a member read anywhere in the condition decides the whole of it,
 * because `state.isPlaying` is not a fact this file holds.
 */
function firstRenderTruth(condition: ts.Expression): Truth {
  const expression = unwrap(condition)

  if (
    ts.isPrefixUnaryExpression(expression) &&
    expression.operator === ts.SyntaxKind.ExclamationToken
  ) {
    const inner = firstRenderTruth(expression.operand)

    return typeof inner === 'boolean' ? !inner : inner
  }

  const literal = literalTruth(expression)
  if (literal !== null) return literal

  if (ts.isIdentifier(expression)) return flagTruth(expression.text, expression, new Set())

  if (ts.isBinaryExpression(expression)) {
    const sides = [firstRenderTruth(expression.left), firstRenderTruth(expression.right)]

    return sides.includes('unknown') ? 'unknown' : 'either'
  }

  return 'unknown'
}

/** The arms the first render can select. */
function reachableArms(truth: Exclude<Truth, 'unknown'>): readonly Arm[] {
  if (truth === 'either') return ['consequent', 'alternate']

  return truth ? ['consequent'] : ['alternate']
}

/** One arm of a ternary: a class string with no interpolation of its own. */
function armText(arm: ts.Expression): string | null {
  const expression = unwrap(arm)

  return ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)
    ? expression.text
    : null
}

/** The first shape: `flag ? 'A' : 'B'`, either polarity. */
function scanTernaries(file: ts.SourceFile): Finding[] {
  const findings: Finding[] = []

  walk(file, (node) => {
    if (!ts.isConditionalExpression(node)) return

    const consequent = armText(node.whenTrue)
    const alternate = armText(node.whenFalse)
    if (consequent === null || alternate === null) return

    const hidden = { consequent: HIDDEN.test(consequent), alternate: HIDDEN.test(alternate) }
    if (!hidden.consequent && !hidden.alternate) return

    const truth = firstRenderTruth(node.condition)
    if (truth === 'unknown') return
    if (!reachableArms(truth).some((which) => hidden[which])) return

    findings.push({
      line: lineOf(file, node.questionToken.getStart(file)),
      detail: `${node.condition.getText(file)} can select opacity-0 on the first render`,
    })
  })

  return findings
}

/** Where a bare `opacity-0` sits in a template's own text, outside its holes. */
function staticHiddenPosition(file: ts.SourceFile, template: ts.TemplateExpression): number | null {
  const parts = [template.head, ...template.templateSpans.map((span) => span.literal)]

  for (const part of parts) {
    const start = part.getStart(file)
    const index = file.text.slice(start, part.getEnd()).search(HIDDEN)
    if (index >= 0) return start + index
  }

  return null
}

/**
 * The second shape: a static `opacity-0` whose only un-hiding is an
 * interpolated `!`-important override.
 */
function scanStaticOverride(file: ts.SourceFile): Finding[] {
  const findings: Finding[] = []

  walk(file, (node) => {
    if (!ts.isTemplateExpression(node)) return

    const hiddenAt = staticHiddenPosition(file, node)
    if (hiddenAt === null) return

    for (const span of node.templateSpans) {
      const ternary = unwrap(span.expression)
      if (!ts.isConditionalExpression(ternary)) continue

      const override = {
        consequent: IMPORTANT_VISIBLE.test(armText(ternary.whenTrue) ?? ''),
        alternate: IMPORTANT_VISIBLE.test(armText(ternary.whenFalse) ?? ''),
      }
      if (!override.consequent && !override.alternate) continue

      const truth = firstRenderTruth(ternary.condition)
      if (truth === 'unknown') continue

      // The static class stays in the markup unless the override wins every
      // arm the first render can take.
      if (reachableArms(truth).every((which) => override[which])) continue

      findings.push({
        line: lineOf(file, hiddenAt),
        detail: 'a static opacity-0 is un-hidden only by an interpolated override',
      })
      break
    }
  })

  return findings
}

/** Every site in `source` both conditions catch. */
export function scan(source: string): Finding[] {
  const file = parse(source)
  if (!wiresLoadEvent(file)) return []

  return [...scanTernaries(file), ...scanStaticOverride(file)].sort((a, b) => a.line - b.line)
}

const lines = (source: string): number[] => scan(source).map((f) => f.line)

const SCANNED = sourceFiles(SOURCE_GLOBS)

describe('server-rendered visibility', () => {
  it('scans the component tree (the guard is not silently empty)', () => {
    expect(SCANNED.length).toBeGreaterThan(50)
  })

  it('finds files wiring a load event (condition 2 is not vacuously false)', () => {
    // Narrowing LOAD_HANDLERS to a spelling nothing uses would silently reduce
    // the guard's real coverage to nothing while every fixture below stayed
    // green.
    const wired = SCANNED.filter((file) => wiresLoadEvent(parse(readFileSync(file, 'utf8'))))

    expect(wired.length).toBeGreaterThan(0)
  })

  it('no component hides its first render behind a load event', () => {
    const findings = SCANNED.flatMap((file) =>
      scan(readFileSync(file, 'utf8')).map(
        (f) => `${relative(repoRoot, file)}:${f.line} → ${f.detail}`,
      ),
    )

    expect(findings).toEqual([])
  })

  it('catches both shapes it claims to catch', () => {
    // Proves the matchers actually fire. Without this, a broken one would make
    // the guard above pass forever.
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

  it('reads a ternary wherever it sits, not only in a className', () => {
    const returned = [
      'const [loaded, setLoaded] = useState(false)',
      "const cls = () => { onLoad; return loaded ? 'opacity-100' : 'opacity-0' }",
    ].join('\n')
    const concatenated = [
      'const [loaded, setLoaded] = useState(false)',
      "const cls = <img onLoad={load} className={'base ' + (loaded ? 'opacity-100' : 'opacity-0')} />",
    ].join('\n')
    const helper = [
      'const [loaded, setLoaded] = useState(false)',
      "const cls = <img onLoad={load} className={cn('base', loaded ? 'opacity-100' : 'opacity-0')} />",
    ].join('\n')

    expect(lines(returned)).toEqual([2])
    expect(lines(concatenated)).toEqual([2])
    expect(lines(helper)).toEqual([2])
  })

  it('reads a comparison against a literal as the condition', () => {
    const sample = [
      "const [status, setStatus] = useState('loading')",
      "const a = <img onLoad={load} className={`${status === 'ready' ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')

    expect(lines(sample)).toEqual([2])
  })

  it('passes a literal the formatter wrapped, and a lazy initialiser', () => {
    const wrapped = [
      'const [isLoading, setIsLoading] = useState(',
      '  true,',
      ')',
      "const a = <img onLoad={load} className={`${isLoading ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')
    const lazy = [
      'const [isLoading, setIsLoading] = useState(() => true)',
      "const a = <img onLoad={load} className={`${isLoading ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')

    expect(scan(wrapped)).toEqual([])
    expect(scan(lazy)).toEqual([])
  })

  it('reports an in-file expression that may take either value', () => {
    // The `ContentCard` gate #153 removed. `!hasImageSrc` is not a literal, so
    // reading "resolve" as "resolve to a literal" would skip the one shape the
    // guard exists for.
    const derived = [
      'const hasImageSrc = thumbnailSrc.length > 0',
      'const [imageLoaded, setImageLoaded] = useState(!hasImageSrc)',
      "const a = <img onLoad={load} className={`${imageLoaded ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')
    // `Accordion`: a call reads outside the file only when its root does, so a
    // method on in-file state stays reported. Rooting the skip in the call
    // itself would wave this through.
    const methodOnState = [
      'const [openItems, setOpenItems] = useState(new Set())',
      'const isOpen = openItems.has(item.id)',
      "const a = <img onLoad={load} className={`${isOpen ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')

    expect(lines(derived)).toEqual([3])
    expect(lines(methodOnState)).toEqual([3])
  })

  it('resolves a prop default, so an inverted-polarity gate passes', () => {
    // `SplashLoader`: `isLoading` starts true, which selects the visible arm. A
    // direction-blind matcher would flag it.
    const sample = [
      'export function SplashLoader({ color = "primary", isLoading = true }: Props) {',
      "  return <img onLoad={load} className={`${isLoading ? 'opacity-100' : 'opacity-0'}`} />",
      '}',
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

  it('skips a flag read from a hook or an import, however it is spelled', () => {
    // Decision 3's whole set. The destructured spelling was the only one the
    // text matcher skipped; the other two reported correct code, which this
    // guard offers no way to exempt.
    const destructured = [
      'const [state, controls] = useAudioPlayer({ url })',
      "const a = <img onLoad={load} className={`${!state.isPlaying || state.isLoading ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')
    const assigned = [
      'const isLoading = useImageLoad(src)',
      "const a = <img onLoad={load} className={`${isLoading ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')
    const imported = [
      "import { loaded } from './flags'",
      "const a = <img onLoad={load} className={`${loaded ? 'opacity-100' : 'opacity-0'}`} />",
    ].join('\n')

    expect(scan(destructured)).toEqual([])
    expect(scan(assigned)).toEqual([])
    expect(scan(imported)).toEqual([])
  })

  it('resolves a flag in its own component, not the file’s first binding', () => {
    // Two components, one flag name. Resolving whole-file let the first
    // `useState` decide both, so the second gate went unreported.
    const sample = [
      'function Visible() {',
      '  const [isLoading, setIsLoading] = useState(false)',
      "  return <img onLoad={load} className={`${isLoading ? 'opacity-100' : 'opacity-0'}`} />",
      '}',
      'function Hidden() {',
      '  const [isLoading, setIsLoading] = useState(true)',
      "  return <img onLoad={load} className={`${isLoading ? 'opacity-0' : 'opacity-100'}`} />",
      '}',
    ].join('\n')

    expect(lines(sample)).toEqual([3, 7])
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
