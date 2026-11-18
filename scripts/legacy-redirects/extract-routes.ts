#!/usr/bin/env tsx
/**
 * Re-exports `data/legacy-redirects/legacy-routes.json` from a checkout of
 * the old Rails app (`sydevs/WeMeditate`): the `routes:` block of each
 * `config/locales/<locale>.yml`, and the locale list in
 * `config/initializers/locale.rb`. It only reads files. The checkout is
 * untrusted, and nothing in it is run.
 *
 *   pnpm redirects:extract-routes <path-to-WeMeditate-checkout> <published-locales>
 *
 * `<published-locales>` is the old app's `PUBLISHED_LOCALES` setting, read with
 * `heroku config:get PUBLISHED_LOCALES -a wemeditate`: the locales it answered
 * rather than redirecting to its maintenance page.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = fileURLToPath(
  new URL('../../data/legacy-redirects/legacy-routes.json', import.meta.url),
)

/** The `routes:` mapping of one locale file: `key: "value"` lines under it. */
export function parseRoutesBlock(yml: string): Record<string, string> {
  const routes: Record<string, string> = {}
  let inside = false

  for (const line of yml.split('\n')) {
    if (/^ {2}routes:/.test(line)) {
      inside = true
      continue
    }
    if (!inside) continue
    // The next two-space key ends the block.
    if (/^ {2}\S/.test(line)) break

    const match = line.match(/^ {4}([a-z_]+):\s*"([^"]*)"/)

    if (match) routes[match[1]] = match[2]
  }

  return routes
}

/** `I18n.available_locales = %i[en ru …]` */
export function parseAvailableLocales(ruby: string): string[] {
  const match = ruby.match(/I18n\.available_locales\s*=\s*%i\[([^\]]+)\]/)

  if (!match) throw new Error('available_locales not found')

  return match[1].trim().split(/\s+/)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const checkout = process.argv[2]

  if (!checkout || !process.argv[3]) {
    console.error('usage: extract-routes.ts <path-to-WeMeditate-checkout> <published-locales>')
    process.exit(1)
  }

  const localesDir = join(checkout, 'config/locales')
  const out: {
    availableLocales: string[]
    publishedLocales: string[]
    routes: Record<string, Record<string, string>>
  } = {
    availableLocales: parseAvailableLocales(
      readFileSync(join(checkout, 'config/initializers/locale.rb'), 'utf8'),
    ),
    publishedLocales: (process.argv[3] ?? '')
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean),
    routes: {},
  }

  for (const file of readdirSync(localesDir)
    .filter((f) => f.endsWith('.yml'))
    .sort()) {
    out.routes[file.replace(/\.yml$/, '')] = parseRoutesBlock(
      readFileSync(join(localesDir, file), 'utf8'),
    )
  }

  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`)
  process.stdout.write(`wrote ${OUT}\n`)
}
