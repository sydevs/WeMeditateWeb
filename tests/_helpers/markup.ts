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
 * The opening `<tag>` of the first one in `html`, or the empty string.
 *
 * Narrowing to the tag before asserting an attribute is what keeps a test from
 * silently matching nothing when the attribute order changes, and from passing
 * on an attribute some other element carries.
 */
export function openTag(html: string, tag: string): string {
  const at = html.indexOf(`<${tag}`)

  return at === -1 ? '' : html.slice(at, html.indexOf('>', at) + 1)
}

/** The `class` attribute of the first `<tag>` in `html`, or the empty string. */
export function classOf(html: string, tag: string): string {
  return /\sclass="([^"]*)"/.exec(openTag(html, tag))?.[1] ?? ''
}
