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
 * The opening `<tag>` carrying this attribute text, or the empty string.
 *
 * Same caveat as `anchorFor`: assert something positive before an absence.
 */
export function tagFor(html: string, tag: string, attribute = ''): string {
  // Matched forwards over the tag's own openings, never backwards from the
  // attribute: an attribute any element may carry would otherwise return a
  // slice spanning two of them.
  for (const [opening] of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))) {
    if (opening.includes(attribute)) return opening
  }

  return ''
}
