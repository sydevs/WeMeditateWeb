/**
 * On Workers Builds, `pnpm ladle:build` switches off SWC's cache-root ancestor check.
 *
 * The build image fails that check for every directory SWC tries, so without the opt-out the
 * `wemeditate-design` Worker never builds (#233). GitHub's runners and macOS pass the check, so
 * no other lane notices the prefix going missing, and `package.json` cannot say why it is there.
 * `WORKERS_CI` is set by Workers Builds alone, which keeps the check on everywhere else.
 */
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const { scripts } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { scripts: Record<string, string> }

describe('ladle:build', () => {
  it('opts out of the SWC cache check on Workers Builds only', () => {
    expect(scripts['ladle:build']).toMatch(
      /^SWC_NATIVE_BINDING_CACHE_SKIP_SECURITY_CHECK=\$\{WORKERS_CI:\+1\} ladle build\b/,
    )
  })
})
