/**
 * The `Cache-Control` this Worker stamps on a cacheable JSON answer of its
 * own: brief, because the heavy work behind it is already edge-cached
 * upstream ([CACHING.md](CACHING.md)), and stale-while-revalidate keeps
 * repeat views instant.
 */
export const JSON_CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=1800'

/**
 * `/robots.txt`, `/sitemap.xml` and `/manifest.webmanifest`: cached at our own
 * edge for an hour, since each changes only when an editor publishes.
 */
export const ROOT_FILE_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'
