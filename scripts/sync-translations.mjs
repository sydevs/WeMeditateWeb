#!/usr/bin/env node
/**
 * Mirrors the CMS `wm-web-translations` English locale into
 * `lib/translations.en.json`.
 *
 * That snapshot is the English the site falls back to when the CMS read
 * fails, and the fixture every test and Ladle story renders with. It is
 * committed, and it is never hand-edited: run this script instead.
 *
 * Usage:
 *   PUBLIC__SAHAJCLOUD_URL=… SAHAJCLOUD_API_KEY=… pnpm sync:translations
 *
 * Both variables are required, with no default origin. A snapshot silently
 * taken from a local CMS would commit placeholder English. The script prints
 * the API client the key belongs to before it writes anything, so a local
 * key pointed at production (or the reverse) is visible in the output.
 *
 * This script is not run in CI. An operator runs it after the CMS English
 * copy changes, and commits the diff.
 */

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const GLOBAL_SLUG = 'wm-web-translations'

/** Response fields that are document metadata, not translation groups. */
const NON_GROUP_KEYS = new Set(['id', '_status', 'updatedAt', 'createdAt', 'globalType'])

const baseURL = process.env.PUBLIC__SAHAJCLOUD_URL
const apiKey = process.env.SAHAJCLOUD_API_KEY

if (!baseURL || !apiKey) {
  console.error(
    'sync-translations: set both PUBLIC__SAHAJCLOUD_URL and SAHAJCLOUD_API_KEY.\n' +
      'There is no default origin — see .env.example.',
  )
  process.exit(1)
}

const authHeaders = { Authorization: `clients API-Key ${apiKey}` }

/** Recursively sorts object keys, so the committed file has a stable diff. */
function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep)
  if (value === null || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortDeep(value[key])]),
  )
}

/** Drops blank strings and empty groups, so a blank CMS key falls through to its key path. */
function prune(value) {
  if (value === null || typeof value !== 'object') return value

  const entries = []

  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string') {
      if (raw.trim().length > 0) entries.push([key, raw])
      continue
    }
    if (raw === null || typeof raw !== 'object') continue

    const nested = prune(raw)
    if (Object.keys(nested).length > 0) entries.push([key, nested])
  }

  return Object.fromEntries(entries)
}

async function getJson(path) {
  const url = `${baseURL}${path}`
  const response = await fetch(url, { headers: authHeaders })

  console.log(`[PayloadCMS] GET ${url} → ${response.status}`)

  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function main() {
  // Name the API client before writing. A stale or wrong-environment key is
  // the failure this catches: the read still succeeds, but against the wrong
  // CMS.
  const me = await getJson('/api/clients/me')
  const client = me?.user?.name ?? me?.user?.email ?? me?.user?.id ?? 'unknown'
  console.log(`Authenticated as API client: ${client}`)

  const translations = await getJson(`/api/globals/${GLOBAL_SLUG}?locale=en&depth=0`)

  if (translations._status !== 'published') {
    console.warn(
      `Warning: ${GLOBAL_SLUG} reports _status "${translations._status}" for English. ` +
        'Publish the English locale in the CMS before trusting this snapshot.',
    )
  }

  const groups = Object.fromEntries(
    Object.entries(translations).filter(([key]) => !NON_GROUP_KEYS.has(key)),
  )
  const snapshot = sortDeep(prune(groups))
  const keyCount = JSON.stringify(snapshot).match(/":"/g)?.length ?? 0

  if (keyCount === 0) {
    console.error(
      `sync-translations: ${GLOBAL_SLUG} returned no English strings. ` +
        'Seed and publish the global before syncing — refusing to write an empty snapshot.',
    )
    process.exit(1)
  }

  const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'lib', 'translations.en.json')
  await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')

  console.log(`Wrote ${keyCount} strings to lib/translations.en.json`)
}

main().catch((error) => {
  console.error('sync-translations failed:', error)
  process.exit(1)
})
