#!/usr/bin/env node
/**
 * Discover the Cloudflare preview URL for the current pull request, wait until it
 * is healthy, and export it as PREVIEW_URL for the smoke specs (tests/smoke).
 *
 * Cloudflare's GitHub git integration deploys a per-PR/branch preview and posts
 * its URL back to the PR head commit. The exact surface varies by setup, so this
 * checks all three (most reliable first) and uses whichever yields a
 * *.pages.dev / *.workers.dev URL:
 *
 *   1. Deployments        GET /repos/{repo}/deployments?sha={sha}
 *                         → GET /deployments/{id}/statuses → status.environment_url
 *                           (Cloudflare Pages posts the unique preview alias here)
 *   2. Commit statuses    GET /repos/{repo}/commits/{sha}/statuses
 *                         → scan target_url / description
 *   3. Check runs         GET /repos/{repo}/commits/{sha}/check-runs
 *                         → scan details_url / output text
 *
 * Reads with the built-in GITHUB_TOKEN; the workflow grants `deployments: read`,
 * `statuses: read`, `checks: read`. No Cloudflare API token is required.
 *
 * Env:
 *   GITHUB_TOKEN       - GitHub token (CI default)
 *   GITHUB_REPOSITORY  - "owner/repo" (CI default)
 *   PR_HEAD_SHA        - PR head commit SHA (github.event.pull_request.head.sha)
 *   HEALTH_PATH        - health endpoint (default "/" — the app has no /api/health)
 *
 * Skips gracefully (empty preview_url, exit 0) when no preview URL appears within
 * the timeout — e.g. no git integration on this PR, or a forked-PR run without the
 * token. Exits 1 only when a URL is found but never becomes healthy (a real
 * failure worth surfacing). Mirrors sy-devs-cms/scripts/get-railway-preview-url.ts.
 *
 * Writes `preview_url=<url>` to $GITHUB_OUTPUT and `PREVIEW_URL=<url>` to $GITHUB_ENV.
 */
import { appendFileSync } from 'node:fs'

const GH_TOKEN = process.env.GITHUB_TOKEN
const REPO = process.env.GITHUB_REPOSITORY
const SHA = process.env.PR_HEAD_SHA
const HEALTH_PATH = process.env.HEALTH_PATH || '/'

const DISCOVER_TIMEOUT_MS = 12 * 60_000 // Cloudflare build + deploy is slow
const HEALTH_TIMEOUT_MS = 5 * 60_000
const POLL_INTERVAL_MS = 15_000
// Matches a Cloudflare preview origin at any subdomain depth, e.g.
// https://abc123.wemeditate-web.pages.dev or https://v1234-wemeditate-web.acct.workers.dev
const PREVIEW_URL_RE = /https?:\/\/[a-z0-9.-]+\.(?:pages\.dev|workers\.dev)/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const extractPreviewUrl = (text) => {
  if (!text) return null
  const match = String(text).match(PREVIEW_URL_RE)
  return match ? match[0] : null
}

async function ghFetch(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'wemeditate-preview-discovery',
    },
  })
  if (!res.ok) throw new Error(`GitHub API ${path}: HTTP ${res.status}`)
  return res.json()
}

// 1. Deployments → statuses → environment_url (Cloudflare Pages' preferred surface).
async function fromDeployments() {
  const deployments = await ghFetch(
    `/repos/${REPO}/deployments?sha=${SHA}&per_page=100`,
  )
  for (const deployment of deployments) {
    const statuses = await ghFetch(
      `/repos/${REPO}/deployments/${deployment.id}/statuses?per_page=100`,
    )
    // Statuses are returned most-recent first.
    for (const status of statuses) {
      const url =
        extractPreviewUrl(status.environment_url) ||
        extractPreviewUrl(status.target_url) ||
        extractPreviewUrl(status.description)
      if (url && (status.state === 'success' || status.state === undefined)) return url
    }
  }
  return null
}

// 2. Commit statuses → target_url / description.
async function fromCommitStatuses() {
  const statuses = await ghFetch(`/repos/${REPO}/commits/${SHA}/statuses?per_page=100`)
  for (const status of statuses) {
    const url =
      extractPreviewUrl(status.target_url) || extractPreviewUrl(status.description)
    if (url) return url
  }
  return null
}

// 3. Check runs → details_url / output.{title,summary,text}.
async function fromCheckRuns() {
  const { check_runs: runs = [] } = await ghFetch(
    `/repos/${REPO}/commits/${SHA}/check-runs?per_page=100`,
  )
  for (const run of runs) {
    const url =
      extractPreviewUrl(run.details_url) ||
      extractPreviewUrl(run.output?.title) ||
      extractPreviewUrl(run.output?.summary) ||
      extractPreviewUrl(run.output?.text)
    if (url) return url
  }
  return null
}

async function discoverUrl() {
  for (const source of [fromDeployments, fromCommitStatuses, fromCheckRuns]) {
    try {
      const url = await source()
      if (url) return url
    } catch (err) {
      console.error(`discovery (${source.name}): ${err.message}`)
    }
  }
  return null
}

async function waitHealthy(url) {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS
  let attempt = 0
  while (Date.now() < deadline) {
    attempt++
    try {
      const res = await fetch(`${url}${HEALTH_PATH}`, { signal: AbortSignal.timeout(10_000) })
      if (res.ok) {
        console.error(`preview healthy after ${attempt} attempt(s)`)
        return true
      }
      console.error(`health attempt ${attempt}: HTTP ${res.status}`)
    } catch (err) {
      console.error(`health attempt ${attempt}: ${err.message}`)
    }
    await sleep(POLL_INTERVAL_MS)
  }
  return false
}

function exportUrl(url) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `preview_url=${url}\n`)
  if (url && process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `PREVIEW_URL=${url}\n`)
}

async function main() {
  if (!GH_TOKEN || !REPO || !SHA) {
    console.error('Missing GITHUB_TOKEN / GITHUB_REPOSITORY / PR_HEAD_SHA — skipping discovery.')
    exportUrl('')
    return
  }

  const deadline = Date.now() + DISCOVER_TIMEOUT_MS
  let url = null
  while (Date.now() < deadline) {
    url = await discoverUrl()
    if (url) break
    console.error('no Cloudflare preview URL on the PR head commit yet...')
    await sleep(POLL_INTERVAL_MS)
  }

  if (!url) {
    console.error('No Cloudflare preview URL found within timeout — skipping smoke.')
    exportUrl('')
    return
  }

  console.error(`preview URL: ${url}`)
  if (!(await waitHealthy(url))) {
    console.error('Preview environment never became healthy.')
    process.exit(1)
  }
  exportUrl(url)
  console.log(url)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
