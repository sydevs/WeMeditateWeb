import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

/** The files Cloudflare Pages reads from the build output to refuse crawlers. */
export const REFUSAL_FILES = ['robots.txt', '_headers'] as const

const staticDir = join(dirname(fileURLToPath(import.meta.url)), 'static')

/** Reads one refusal file from `.ladle/static/`. */
export function readRefusalFile(fileName: (typeof REFUSAL_FILES)[number]): string {
  return readFileSync(join(staticDir, fileName), 'utf8')
}

/**
 * Adds the crawler refusal to the Ladle build output (#174).
 *
 * Two shorter routes do not work. `public/` is copied into the Vike app's build as well, where
 * `Disallow: /` would answer on wemeditate.com. And Vite takes one `publicDir`, so pointing it
 * at `.ladle/static` would replace `public/` for Ladle — which needs it, for the Raleway and
 * Futura faces `layouts/fonts.css` fetches and the background `DiscoverMeditation` renders.
 *
 * Emitting rather than copying keeps this working wherever Ladle points `outDir`, and under a
 * bare `ladle build` as much as under `pnpm ladle:build` — the Pages project's build command is
 * set in the Cloudflare dashboard, not here.
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
