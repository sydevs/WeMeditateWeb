#!/usr/bin/env node
/**
 * Run AFTER `pnpm types:cms`. Compares the freshly copied
 * server/payload-types.ts with the committed one and fails when they differ.
 * Used by .github/workflows/types-drift.yml.
 *
 * Exit 0: current. Exit 1: drift (diff stat in the job summary). A failed
 * download fails the `pnpm types:cms` step before this runs.
 */

import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'

const FILE = 'server/payload-types.ts'
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' })

const stat = git('diff', '--stat', '--', FILE).trim()
const summaryPath = process.env.GITHUB_STEP_SUMMARY

function summarize(text) {
  if (summaryPath) appendFileSync(summaryPath, `${text}\n`)
  else console.log(text)
}

if (!stat) {
  summarize(`### Payload types\n\n\`${FILE}\` matches SahajCloud \`main\`.`)
  process.exit(0)
}

const diff = git('diff', '--unified=0', '--', FILE).split('\n')
const preview = diff.slice(0, 80).join('\n')

summarize(
  [
    '### Payload types have drifted from SahajCloud `main`',
    '',
    `\`${FILE}\` differs from what \`pnpm types:cms\` fetches now:`,
    '',
    '```',
    stat,
    '```',
    '',
    'To fix: run `pnpm types:cms`, run `pnpm typecheck`, and open a `chore(contracts)` PR with the result.',
    '',
    '<details><summary>First lines of the diff</summary>',
    '',
    '```diff',
    preview,
    '```',
    '</details>',
  ].join('\n'),
)
console.log(`::error::${FILE} is out of date with SahajCloud main. Run pnpm types:cms and commit the result.\n${stat}`)
process.exit(1)
