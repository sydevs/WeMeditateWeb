#!/usr/bin/env node
/**
 * Reads the vitest JSON report a smoke run wrote and puts its counts in the
 * job summary. A smoke spec that calls `ctx.skip(...)` (no discoverable page,
 * no SAHAJCLOUD_API_KEY) is reported by vitest as a pass of the run, so a leg
 * where every spec skipped is a green check that asserted nothing. This makes
 * that visible: a count always, and a warning annotation when nothing ran or
 * nothing asserted.
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
const total = report.numTotalTests ?? 0
const passed = report.numPassedTests ?? 0
const failed = report.numFailedTests ?? 0
const skipped = report.numPendingTests ?? 0
const todo = report.numTodoTests ?? 0
// A spec that neither passed nor failed asserted nothing, skipped or todo alike.
const silent = skipped + todo

summarize([
  `### Smoke (${target}) results`,
  '',
  '| Passed | Failed | Skipped | Todo | Total |',
  '| ---: | ---: | ---: | ---: | ---: |',
  `| ${passed} | ${failed} | ${skipped} | ${todo} | ${total} |`,
  ...(silent > 0 && silent < total
    ? ['', `${silent} of ${total} specs asserted nothing (no discoverable content, or no SAHAJCLOUD_API_KEY).`]
    : []),
])

if (total === 0) {
  console.log(`::warning::No ${target} smoke specs were collected.`)
} else if (silent === total) {
  console.log(
    `::warning::No ${target} smoke spec asserted anything (${skipped} skipped, ${todo} todo, of ${total}) — this green check tested nothing. Likely no SAHAJCLOUD_API_KEY, or the preview had no content to discover.`,
  )
  summarize(['', `⚠️ **No ${target} smoke spec asserted anything. This check tested nothing.**`])
}
