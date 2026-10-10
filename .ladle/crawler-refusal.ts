import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

/**
 * The files Cloudflare Pages reads from the build output to refuse crawlers. `robots.txt`
 * carries the policy and the reason both are needed.
 */
export const REFUSAL_FILES = ['robots.txt', '_headers'] as const

const staticDir = join(dirname(fileURLToPath(import.meta.url)), 'static')

/** Reads one refusal file from `.ladle/static/`. */
export function readRefusalFile(fileName: (typeof REFUSAL_FILES)[number]): string {
  return readFileSync(join(staticDir, fileName), 'utf8')
}

/**
 * Copies the crawler refusal into the Ladle build output.
 *
 * `public/` is the obvious home and the wrong one: Ladle copies Vite's `publicDir` for free,
 * but so does the Vike app's build, and a `Disallow: /` served on wemeditate.com would drop
 * the whole site from every index (#174).
 *
 * This emits instead of copying, so the files land wherever Ladle points `outDir`, and under
 * `ladle build` as much as under `pnpm ladle:build` — the Pages project's build command is set
 * in the Cloudflare dashboard, not here.
 *
 * ⚠ Ladle sets Vite's `root` inside its own package, so a path relative to the root resolves
 * into `node_modules`. Resolve from this file instead.
 */
export function crawlerRefusal(): Plugin {
  return {
    name: 'ladle-crawler-refusal',
    apply: 'build',
    generateBundle() {
      for (const fileName of REFUSAL_FILES) {
        this.emitFile({ type: 'asset', fileName, source: readRefusalFile(fileName) })
      }
    },
  }
}
