#!/usr/bin/env node
/**
 * Puts the axe gate's per-page violation counts in the job summary, so the
 * result is visible on a pull request without anyone opening the log
 * (sydevs/WeMeditateWeb#162, "its result is visible without anyone asking").
 *
 * Usage: node scripts/a11y-summary.mjs [report.json]
 *
 * It only reports and never fails the job: the spec itself is what blocks a
 * change, and a missing report means the spec did not reach its own teardown —
 * which is a failure the test step has already reddened.
 */

import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const [reportPath = 'a11y-report.json'] = process.argv.slice(2)
const summaryPath = process.env.GITHUB_STEP_SUMMARY

function summarize(lines) {
  const text = `${lines.join('\n')}\n`

  if (summaryPath) appendFileSync(summaryPath, text)
  else console.log(text)
}

if (!existsSync(reportPath)) {
  console.log('::warning::The accessibility gate wrote no report, so it did not finish.')
  summarize(['### Accessibility (axe)', '', '⚠️ No report was written — the gate did not finish.'])
  process.exit(0)
}

const { targets = [] } = JSON.parse(readFileSync(reportPath, 'utf8'))

if (targets.length === 0) {
  console.log('::warning::The accessibility gate reported no targets.')
  summarize(['### Accessibility (axe)', '', '⚠️ No page types were checked.'])
  process.exit(0)
}

const total = targets.reduce((sum, { violations }) => sum + violations.length, 0)

summarize([
  '### Accessibility (axe)',
  '',
  '| Page type | Violations |',
  '| --- | ---: |',
  ...targets.map(({ target, violations }) => `| ${target} | ${violations.length} |`),
  '',
  ...(total === 0
    ? ['No violations across all page types.']
    : targets
        .filter(({ violations }) => violations.length > 0)
        .flatMap(({ target, violations }) => [
          `**${target}**`,
          '',
          ...violations.map((violation) => `- ${violation}`),
          '',
        ])),
])
