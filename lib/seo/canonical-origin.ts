/**
 * Which origins are the real site, and so may be crawled and counted.
 */

/**
 * Hosts that must never be indexed or counted: the Cloudflare preview
 * deployments, and every address a development machine answers on.
 *
 * Every PR builds a preview Worker and a preview Ladle site on these
 * domains. A preview that invites crawlers competes with production for
 * the same content, and can outrank it. So this rule works as an
 * allowlist by exclusion, applied to whatever host actually served the
 * request, not to a build-time guess.
 *
 * The private ranges count as development too: `vite --host` serves the LAN
 * address as well as the `localhost` it prints, and that is the one a
 * developer opens on a phone. Each is matched as a whole dotted quad, so a
 * public host named `10.wemeditate.com` stays the real site. `URL` keeps an
 * IPv6 host's brackets, so `[::1]` is the literal to match.
 *
 * shortcut: a dev machine reached at a spelling outside these ranges still
 * reads as the real site — a Tailscale `100.64/10` address, a `*.localhost`
 * subdomain, link-local `169.254/16`, or the IPv4-mapped `[::ffff:7f00:1]`,
 * which `URL` does not fold to `127.0.0.1`. Add the spelling if anyone here
 * starts developing that way.
 */
const NON_CANONICAL_HOSTS = [
  /(\.workers\.dev|\.pages\.dev)$/,
  /^localhost$|^\[::1\]$|^0\.0\.0\.0$/,
  /^127(\.\d{1,3}){3}$/,
  /^10(\.\d{1,3}){3}$/,
  /^192\.168(\.\d{1,3}){2}$/,
  /^172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}$/,
]

/**
 * Whether this origin is the real site, and so may be crawled and counted.
 *
 * Takes an origin rather than a host because every caller has one: the
 * robots.txt and sitemap.xml routes read it off the request, and the analytics tag in
 * `pages/+Head.tsx` reads it off `pageContext`. A host-level predicate made
 * each of them spell the same parse.
 */
export function isCanonicalOrigin(origin: string): boolean {
  const { hostname } = new URL(origin)

  return !NON_CANONICAL_HOSTS.some((pattern) => pattern.test(hostname))
}
