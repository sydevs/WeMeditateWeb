/**
 * Post-processes the downloaded server/payload-types.ts (see the `types:cms`
 * script) by stripping the trailing `declare module 'payload'` augmentation.
 *
 * Upstream (SahajCloud) emits this block so the Payload *backend* can wire its
 * generated `Config` into Payload's `GeneratedTypes`:
 *
 *     declare module 'payload' {
 *       export interface GeneratedTypes extends Config {}
 *     }
 *
 * This Cloudflare Workers frontend talks to the CMS only through
 * `@payloadcms/sdk` (typed explicitly via `new PayloadSDK<Config>()`), and does
 * NOT depend on the `payload` package. With `payload` absent, the augmentation
 * fails to compile (`TS2664: module 'payload' cannot be found`). Removing it has
 * no effect on the SDK's typing — it only clears that error.
 */

import { readFile, writeFile } from 'node:fs/promises'

const TYPES_PATH = new URL('../server/payload-types.ts', import.meta.url)

// Matches the augmentation block (and any whitespace preceding it) through EOF.
// The block is always emitted last, so removing to end-of-file is safe.
const AUGMENTATION_RE = /\s*declare module 'payload'[\s\S]*$/

const source = await readFile(TYPES_PATH, 'utf8')

if (!AUGMENTATION_RE.test(source)) {
  console.warn(
    "[strip-payload-augmentation] No `declare module 'payload'` block found — " +
      'upstream format may have changed. Leaving payload-types.ts untouched.'
  )
  process.exit(0)
}

const stripped = source.replace(AUGMENTATION_RE, '') + '\n'
await writeFile(TYPES_PATH, stripped)
console.log("[strip-payload-augmentation] Removed `declare module 'payload'` augmentation.")
