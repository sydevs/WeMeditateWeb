/**
 * Assertion primitives for `renderToStaticMarkup` output.
 *
 * A server render is a string, not a DOM (`docs/rules/testing.md`), so a test
 * that cares *which* element carries an attribute has to narrow the HTML
 * string itself.
 *
 * Each returns the empty string when nothing matches, so assert something
 * positive about the result before asserting an absence: `not.toContain`
 * passes on the empty string whatever it is given. A class list is a
 * space-separated string, so `split(' ')` before asserting membership —
 * `toContain('order-1')` over the string also passes on `order-10`.
 */

/**
 * The opening `<a>` tag carrying this href, or the empty string.
 */
export function anchorFor(html: string, href: string): string {
  const at = html.indexOf(`href="${href}"`)

  return at === -1 ? '' : html.slice(html.lastIndexOf('<a', at), html.indexOf('>', at) + 1)
}

/**
 * The opening `<tag>` carrying this attribute text, or the empty string.
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

/**
 * Every class list carrying this class, in document order.
 *
 * The class is matched whole, so `opacity-0` passes over `after:opacity-0`
 * and `order-1` over `order-10`. Count with it where the assertion is how
 * many elements carry a class.
 */
export function classesWith(html: string, cssClass: string): string[] {
  return [...html.matchAll(/\sclass="([^"]*)"/g)]
    .map(([, list]) => list)
    .filter((list) => list.split(/\s+/).includes(cssClass))
}

/**
 * The class list of the first element carrying this class, or the empty
 * string.
 *
 * A class naming the element on its own is the key. Two adjacent classes are
 * not one: nothing fixes the order of a class list, so a pattern anchored on
 * two of them sitting together breaks on the next edit. Where no single class
 * identifies the element, name the element itself with `classOf`.
 */
export function classFor(html: string, cssClass: string): string {
  return classesWith(html, cssClass)[0] ?? ''
}

/**
 * The class list of the element this marker names, or the empty string.
 *
 * The marker is an opening tag (`'<nav'`) or a run of the element's own text
 * (`'Timeless teachings'`) — what the test already knows the element by, the
 * way `anchorFor` takes the href the test passed in. Text identifies the
 * element that opens immediately before it, so pass a run with no markup
 * inside it.
 */
export function classOf(html: string, marker: string): string {
  const at = html.indexOf(marker)

  if (at === -1) return ''

  const open = marker.startsWith('<') ? at : html.lastIndexOf('<', at)
  const close = open === -1 ? -1 : html.indexOf('>', open)

  return close === -1 ? '' : (/\sclass="([^"]*)"/.exec(html.slice(open, close))?.[1] ?? '')
}
