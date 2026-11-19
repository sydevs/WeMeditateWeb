import axe, { type Result } from 'axe-core'

/**
 * axe over a rendered fragment, for a component state no page fixture can
 * reach — an open popover, an expanded panel. Needs a jsdom test file.
 *
 * ⚠ `TAGS` mirrors the gate's own in `tests/a11y/page-types.test.tsx`; change
 * both together. `color-contrast` and `target-size` are off for the same
 * reason as there: jsdom draws no box. `region` is off because a component
 * rendered bare sits in no landmark, so it would answer about the test rather
 * than the component; the gate holds it over whole pages.
 *
 * Unlike the gate, this counts violations only. The gate counts `incomplete`
 * for the page-level rules, which never run over a fragment; here axe answers
 * "needs review" for every `aria-controls` beside an `aria-haspopup`, even one
 * that resolves, so a caller asserts that reference directly instead.
 *
 * Floating UI's focus guards are left out. They are the library's markup, and
 * jsdom's `navigator.vendor` ("Apple Computer, Inc.") makes it take its Safari
 * branch, which gives each guard an unnamed `role="button"`.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

/** Violations as `<rule-id>: <targets>`, so a failure reads. */
export async function axeViolations(context: Element = document.body): Promise<string[]> {
  const result = await axe.run(
    { include: [context], exclude: [['[data-floating-ui-focus-guard]']] },
    {
      runOnly: { type: 'tag', values: TAGS },
      rules: {
        'color-contrast': { enabled: false },
        'target-size': { enabled: false },
        region: { enabled: false },
      },
    },
  )

  return result.violations.map(
    (finding: Result) =>
      `${finding.id}: ${finding.nodes.map((node) => node.target.join(' ')).join(' | ')}`,
  )
}
