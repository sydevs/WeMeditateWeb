#!/usr/bin/env tsx
/**
 * Regenerates `lib/legacy-redirects/map.generated.json` and
 * `data/legacy-redirects/COVERAGE.md` from the three committed snapshots in
 * `data/legacy-redirects/`. Offline and deterministic.
 *
 *   pnpm redirects:generate
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { buildRedirectMap, type Inventory, type LegacyRoutes, type NewSite } from './build'
import { stringifyMap } from './map-format'
import { renderCoverage } from './report'

const root = (path: string): string => fileURLToPath(new URL(`../../${path}`, import.meta.url))
const read = <T>(path: string): T => JSON.parse(readFileSync(root(path), 'utf8')) as T

const inventory = read<Inventory>('data/legacy-redirects/legacy-inventory.json')
const legacy = read<LegacyRoutes>('data/legacy-redirects/legacy-routes.json')
const site = read<NewSite>('data/legacy-redirects/new-site.json')
const result = buildRedirectMap(inventory, legacy, site)

writeFileSync(root('lib/legacy-redirects/map.generated.json'), stringifyMap(result.map))
writeFileSync(root('data/legacy-redirects/COVERAGE.md'), renderCoverage(result, inventory, site))

process.stdout.write(`urls: ${result.urls.length}\n`)
process.stdout.write(`conflicts: ${result.conflicts.length}\n`)
process.stdout.write(`violations: ${result.violations.length}\n`)
for (const violation of result.violations.slice(0, 20)) process.stdout.write(`  ${violation}\n`)
if (result.violations.length > 0) process.exitCode = 1
