/**
 * The Sahaj Atlas widget embed for the `/map` pages.
 *
 * The loader (`auto.js`, about 3 KiB) adopts the server-rendered
 * `<sahaj-atlas>` element, then fetches the widget itself when the element
 * nears the viewport. Every setting rides on this URL. The element takes
 * no attributes, because a platform that sanitizes saved HTML strips
 * unknown attributes, but leaves a script URL's query string intact.
 */

/** Where the loader is published. See the contract recorded in `docs/embedding.md`. */
const ATLAS_LOADER_ORIGIN = 'https://sahajatlas.com'

/**
 * Builds the loader URL for one atlas route.
 *
 * Two parameters beyond the key, and the pairing is deliberate:
 *
 * - `routing=path`, so the widget's route lives in this site's pathname
 *   and matches the SSR routes exactly. This is the only mode consistent
 *   with these URLs. Under the default `query` mode, the widget would find
 *   no `?atlas=` on `/map/nl/amsterdam`, open the atlas root, and replace
 *   the very content just server-rendered. The page's `<head>` would then
 *   describe Amsterdam while its body showed the world.
 * - `atlas`, the route to open at. The widget treats this as a default: a
 *   route already on the page URL overrides it. In path mode that looks
 *   redundant, but path mode has two prerequisites this repo does not
 *   fully control (a wildcard route, which this repo has, and a canonical
 *   embed on the client record naming the mounted page). If the second is
 *   missing, the widget falls back to query routing, and logs this to the
 *   console. This parameter is what still lands the visitor on the right
 *   region, instead of the atlas root.
 *
 * @param options.key - The published client key (public by design)
 * @param options.atlasRoute - The route this page is of, e.g. `/nl/amsterdam`
 */
export function atlasEmbedSrc(options: { key: string; atlasRoute: string }): string {
  const params = new URLSearchParams({
    key: options.key,
    routing: 'path',
    atlas: options.atlasRoute,
  })

  return `${ATLAS_LOADER_ORIGIN}/auto.js?${params.toString()}`
}
