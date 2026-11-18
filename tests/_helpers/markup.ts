/**
 * Assertion primitives for `renderToStaticMarkup` output.
 *
 * A server render is a string, not a DOM (`docs/rules/testing.md`), so a test
 * that cares *which* element carries an attribute has to narrow the HTML
 * string itself.
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

/**
 * The class attribute containing this marker, or the empty string.
 *
 * Assert something positive about the result before asserting an absence:
 * `not.toContain` passes on the empty string whatever it is given.
 */
export function classFor(html: string, marker: string): string {
  const at = html.indexOf(marker)

  if (at === -1) return ''

  const open = html.lastIndexOf('class="', at)
  const end = open === -1 ? -1 : html.indexOf('"', open + 7)

  return end === -1 || end < at ? '' : html.slice(open + 7, end)
}
