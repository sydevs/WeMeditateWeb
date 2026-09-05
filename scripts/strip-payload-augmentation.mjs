/**
 * Processes the downloaded server/payload-types.ts (see the `types:cms`
 * script). Strips the trailing `declare module 'payload'` augmentation.
 *
 * SahajCloud emits this block so its Payload backend can wire the generated
 * `Config` into Payload's `GeneratedTypes`:
 *
 *     declare module 'payload' {
 *       export interface GeneratedTypes extends Config {}
 *     }
 *
 * This Cloudflare Workers frontend talks to the CMS only through
 * `@payloadcms/sdk` (typed with `new PayloadSDK<Config>()`). It does not
 * depend on the `payload` package. Without `payload`, the augmentation fails
 * to compile (`TS2664: module 'payload' cannot be found`). Removing it does
 * not change the SDK's typing. It only clears that error.
 */

import { readFile, writeFile } from 'node:fs/promises'

const TYPES_PATH = new URL('../server/payload-types.ts', import.meta.url)

// Matches the augmentation block, plus any whitespace before it, through the
// end of the file. The block always comes last, so this is safe to remove.
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
