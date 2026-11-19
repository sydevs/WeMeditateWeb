import axe, { type Result, type RunOptions } from 'axe-core'

/**
 * The rule set the accessibility goal asks for. Both axe runs in this repo
 * take it from here — the page gate in `tests/a11y/page-types.test.tsx` and
 * `axeViolations` below — so neither can drift from the other.
 */
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

/** `AXE_TAGS`, with each id in `disabled` switched off by name. */
export function axeOptions(disabled: string[]): RunOptions {
  return {
    runOnly: { type: 'tag', values: AXE_TAGS },
    rules: Object.fromEntries(disabled.map((id) => [id, { enabled: false }])),
  }
}

/**
 * Rules a bare fragment cannot answer. `color-contrast` and `target-size` need
 * a drawn box, which jsdom has none of. `region` would answer about the test:
 * a component rendered bare sits in no landmark, and the gate holds that rule
 * over whole pages instead.
 */
const FRAGMENT_UNDECIDABLE = ['color-contrast', 'target-size', 'region']

/**
 * axe over a rendered fragment, for a component state no page fixture can
 * reach — an open popover, an expanded panel. Needs a jsdom test file.
 *
 * Unlike the gate, this counts violations only. The gate counts `incomplete`
 * for the page-level rules, which never run over a fragment; here axe answers
 * "needs review" for every `aria-controls` beside an `aria-haspopup`, even one
 * that resolves, so a caller asserts that reference directly instead.
 *
 * Floating UI's focus guards are left out. They are the library's markup, and
 * jsdom's `navigator.vendor` ("Apple Computer, Inc.") makes it take its Safari
 * branch, which gives each guard an unnamed `role="button"`.
 *
 * Violations come back as `<rule-id>: <targets>`, so a failure reads.
 */
export async function axeViolations(context: Element = document.body): Promise<string[]> {
  const result = await axe.run(
    { include: [context], exclude: [['[data-floating-ui-focus-guard]']] },
    axeOptions(FRAGMENT_UNDECIDABLE),
  )

  return result.violations.map(
    (finding: Result) =>
      `${finding.id}: ${finding.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  )
}
