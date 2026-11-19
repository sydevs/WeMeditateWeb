/**
 * No shell script under `scripts/` stops a process.
 *
 * Several sessions can drive one debug Chrome, and AGENTS.md forbids stopping it or any process a
 * session did not start. `scripts/chrome-debug.sh` ran `pkill -f "Google Chrome"` before every
 * launch, which closed every Chrome on the machine, the user's own browser included.
 */
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { repoRoot } from './_source-scan'

/** Each script's command lines: comments and `echo`ed advice are not commands. */
const commands = globSync('scripts/**/*.sh', { cwd: repoRoot }).flatMap((file) =>
  readFileSync(join(repoRoot, file), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('echo '))
    .map((line) => `${file}: ${line}`),
)

describe('shell scripts', () => {
  it('stop no process', () => {
    expect(commands.some((line) => line.startsWith('scripts/chrome-debug.sh: '))).toBe(true)
    expect(commands.filter((line) => /\b(pkill|killall|kill)\b/.test(line))).toEqual([])
  })
})
