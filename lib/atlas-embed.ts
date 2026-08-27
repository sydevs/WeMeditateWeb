/**
 * The Sahaj Atlas widget embed for the `/map` pages.
 *
 * The loader (`auto.js`, ~3 KiB) adopts the `<sahaj-atlas>` element we
 * server-render, then fetches the widget itself when the element nears the
 * viewport. Every setting rides on this URL — the element takes no attributes,
 * because platforms that sanitize saved HTML strip unknown attributes but leave
 * a script URL's query string intact.
 */

/** Where the loader is published. A published contract in `docs/embedding.md`. */
const ATLAS_LOADER_ORIGIN = 'https://sahajatlas.com'

/**
 * Build the loader URL for one atlas route.
 *
 * Two parameters beyond the key, and the pairing is deliberate:
 *
 * - **`routing=path`**, so the widget's route lives in our pathname and matches
 *   the SSR routes exactly. It is the only mode consistent with these URLs:
 *   under the default `query` mode the widget would find no `?atlas=` on
 *   `/map/nl/amsterdam`, open the atlas *root*, and replace the very content we
 *   server-rendered — the page's `<head>` would then describe Amsterdam while
 *   its body showed the world.
 * - **`atlas`**, the route to open at, which the widget treats as a *default*
 *   that a route already on the page URL overrides. In path mode that is
 *   redundant; it earns its place because path mode has two prerequisites we do
 *   not control from this repo (a wildcard route — which we have — and a
 *   canonical embed on the client record naming the mounted page). If the second
 *   is missing the widget falls back to query routing and says so in the
 *   console, and this parameter is what still lands the visitor on the right
 *   region instead of the atlas root.
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
