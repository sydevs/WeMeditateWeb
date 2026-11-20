#!/usr/bin/env tsx
/**
 * Re-exports `data/legacy-redirects/legacy-inventory.json` from the old
 * site's database. Needs the Heroku CLI signed in with access to the
 * `wemeditate` app. Every statement is a SELECT (see `queries.ts`).
 *
 *   pnpm redirects:export-inventory
 */

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { QUERIES, type QueryName } from './queries'
import { stringifyOneRowPerLine } from './json'

const OUT = fileURLToPath(
  new URL('../../data/legacy-redirects/legacy-inventory.json', import.meta.url),
)

function select(name: QueryName): Row[] {
  const out = execFileSync(
    'heroku',
    ['pg:psql', '-a', 'wemeditate', '-c', `select row_to_json(t) from (${QUERIES[name]}) t`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  )

  // psql prints each json value as one line with a single leading space.
  return out
    .split('\n')
    .filter((line) => line.startsWith(' {'))
    .map((line) => JSON.parse(line.slice(1)) as Row)
}

type Row = Record<string, unknown>

const HISTORY_TABLE: Record<string, string> = {
  Article: 'articles',
  Meditation: 'meditations',
  PromoPage: 'promoPages',
  Stream: 'streams',
  SubtleSystemNode: 'subtleSystemNodes',
  Treatment: 'treatments',
}

/**
 * A slug history row belongs in the inventory only when its record was
 * published in that locale, which the other queries already filtered for.
 * Streams and promo pages have one locale of their own, so their history rows
 * carry none.
 */
function keepPublishedHistory(history: Row[], inventory: Record<string, unknown>): Row[] {
  const published = new Set<string>()

  for (const table of Object.values(HISTORY_TABLE)) {
    for (const row of inventory[table] as Row[]) published.add(`${table}:${row.id}:${row.locale}`)
  }

  return history.flatMap((row) => {
    const table = HISTORY_TABLE[row.sluggable_type as string]
    const single = table === 'streams' || table === 'promoPages'
    const locale = single
      ? (inventory[table] as Row[]).find((r) => r.id === row.sluggable_id)?.locale
      : row.locale

    if (!locale || !published.has(`${table}:${row.sluggable_id}:${locale}`)) return []

    return [{ ...row, locale }]
  })
}

const { exported_on: exportedOn } = select('exportedOn')[0] as { exported_on: string }

const inventory: Record<string, unknown> = { exportedOn }

for (const name of Object.keys(QUERIES) as QueryName[]) {
  if (name !== 'exportedOn' && name !== 'slugHistory') inventory[name] = select(name)
}

inventory.slugHistory = keepPublishedHistory(select('slugHistory'), inventory)

writeFileSync(OUT, stringifyOneRowPerLine(inventory))
process.stdout.write(`wrote ${OUT}\n`)
