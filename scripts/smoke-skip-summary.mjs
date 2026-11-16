#!/usr/bin/env node
/**
 * Reads the vitest JSON report a smoke run wrote and puts the pass/fail/skip
 * counts in the job summary. A smoke spec that calls `ctx.skip(...)` (no
 * discoverable page, no SAHAJCLOUD_API_KEY) is reported by vitest as a pass
 * of the run, so a leg where every spec skipped is a green check that
 * asserted nothing. This makes that visible: a count always, and a warning
 * annotation when nothing ran or everything skipped.
 *
 * Usage: node scripts/smoke-skip-summary.mjs <report.json> <target>
 *
 * It only reports and never fails the job. Whether a missing preview is red is
 * the `require_preview` policy in ci.yml.
 */

import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const [reportPath, target = 'smoke'] = process.argv.slice(2)
const summaryPath = process.env.GITHUB_STEP_SUMMARY

function summarize(lines) {
  const text = `${lines.join('\n')}\n`

  if (summaryPath) appendFileSync(summaryPath, text)
  else console.log(text)
}

if (!reportPath || !existsSync(reportPath)) {
  console.log(`::warning::No ${target} smoke report was written, so NO ${target} smoke specs ran.`)
  summarize([`### Smoke (${target}) results`, '', '⚠️ No smoke specs ran (no vitest report).'])
  process.exit(0)
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const tests = (report.testResults ?? []).flatMap((file) => file.assertionResults ?? [])
const count = (...statuses) => tests.filter((t) => statuses.includes(t.status)).length
const passed = count('passed')
const failed = count('failed')
const skipped = count('skipped', 'pending')
const total = tests.length

summarize([
  `### Smoke (${target}) results`,
  '',
  '| Passed | Failed | Skipped | Total |',
  '| ---: | ---: | ---: | ---: |',
  `| ${passed} | ${failed} | ${skipped} | ${total} |`,
  ...(skipped > 0 && skipped < total
    ? ['', `${skipped} of ${total} specs skipped (no discoverable content, or no SAHAJCLOUD_API_KEY).`]
    : []),
])

if (total === 0) {
  console.log(`::warning::No ${target} smoke specs were collected.`)
} else if (skipped === total) {
  console.log(
    `::warning::Every ${target} smoke spec skipped (${skipped} of ${total}) — this green check asserted nothing. Likely no SAHAJCLOUD_API_KEY, or the preview had no content to discover.`,
  )
  summarize(['', `⚠️ **Every ${target} smoke spec skipped. This check asserted nothing.**`])
}
