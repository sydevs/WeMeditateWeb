import { readFileSync } from 'node:fs'

/**
 * A PNG's own pixel dimensions, read from its IHDR chunk.
 *
 * Two constants in `lib/` restate an asset's geometry — the share card's, so
 * `og:image:width`/`height` can be stated before a scraper has fetched the
 * bytes, and the app icon's, which the manifest declares as `sizes`. This is
 * what stops either drifting from the file it describes.
 */
export function pngSize(path: string): { width: number; height: number } {
  const header = readFileSync(path).subarray(0, 24)

  if (header.toString('latin1', 12, 16) !== 'IHDR') {
    throw new Error(`not a PNG: ${path}`)
  }

  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
}
