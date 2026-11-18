/**
 * Assertion primitives for `renderToStaticMarkup` output.
 *
 * The suite runs in `environment: 'node'` with no DOM to query
 * (`docs/rules/testing.md`), so a test that cares *which* element carries an
 * attribute has to narrow the HTML string itself.
 */

/**
 * The opening `<a>` tag carrying this href, or the empty string.
 *
 * Assert something positive about the result before asserting an absence:
 * `not.toContain` passes on the empty string whatever it is given.
 */
export function anchorFor(html: string, href: string): string {
  const at = html.indexOf(`href="${href}"`)

  return at === -1 ? '' : html.slice(html.lastIndexOf('<a', at), html.indexOf('>', at) + 1)
}
