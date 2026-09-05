#!/usr/bin/env node
/**
 * Finds the Cloudflare preview URL for the web app on the current pull
 * request, waits until it responds, and exports it as PREVIEW_URL for the
 * smoke specs (tests/smoke). See docs/cloudflare-previews-ci.md for why this
 * script is project-aware, where Cloudflare posts the URL, and the
 * HTTP-reachability trap.
 *
 * Env:
 *   GITHUB_TOKEN        - GitHub token (CI default)
 *   GITHUB_REPOSITORY   - "owner/repo" (CI default)
 *   PR_HEAD_SHA         - PR head commit SHA (github.event.pull_request.head.sha)
 *   PR_NUMBER           - PR number (github.event.pull_request.number).
 *                         Enables the primary PR-comment source.
 *   CF_PROJECT_MATCH    - substring the target project or host must contain
 *                         (for example "wemeditate-web"). When unset, the
 *                         script accepts any non-Ladle preview.
 *   HEALTH_PATH         - health endpoint (default "/", since the app has no /api/health)
 *   DISCOVER_TIMEOUT_MS / HEALTH_TIMEOUT_MS / POLL_INTERVAL_MS - optional overrides
 *
 * Skips gracefully (empty preview_url, exit 0) when no matching preview
 * appears within the timeout, for example before the web-app preview exists,
 * or on a forked PR without permissions. Exits 1 only when a matching URL is
 * found but never becomes healthy. Writes `preview_url=<url>` to
 * $GITHUB_OUTPUT and `PREVIEW_URL=<url>` to $GITHUB_ENV.
 */
import { appendFileSync } from 'node:fs'

const GH_TOKEN = process.env.GITHUB_TOKEN
const REPO = process.env.GITHUB_REPOSITORY
const SHA = process.env.PR_HEAD_SHA
const PR_NUMBER = process.env.PR_NUMBER
const CF_PROJECT_MATCH = process.env.CF_PROJECT_MATCH
const HEALTH_PATH = process.env.HEALTH_PATH || '/'

// Poll for the full build window only when a target project is set (a real
// build to wait for). Before CF_PROJECT_MATCH is set, there is no web-app
// preview to wait for. Check quickly, then skip, instead of waiting 12 minutes.
const DISCOVER_TIMEOUT_MS =
  Number(process.env.DISCOVER_TIMEOUT_MS) || (CF_PROJECT_MATCH ? 12 * 60_000 : 30_000)
const HEALTH_TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT_MS) || 5 * 60_000
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS) || 15_000

// The design-system (Ladle) Cloudflare project. Never run smoke tests on it.
const EXCLUDE = ['wm-design', 'wemeditate-design']
// Matches a Cloudflare preview origin at any subdomain depth.
const PREVIEW_URL_RE = /https?:\/\/[a-z0-9.-]+\.(?:pages\.dev|workers\.dev)/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const extractPreviewUrl = (text) => String(text ?? '').match(PREVIEW_URL_RE)?.[0] ?? null

/** Returns true when this candidate (project name and url) is the smoke-test target. */
function matchesTarget(project, url) {
  const hay = `${project ?? ''} ${url ?? ''}`.toLowerCase()
  if (CF_PROJECT_MATCH) return hay.includes(CF_PROJECT_MATCH.toLowerCase())
  return !EXCLUDE.some((x) => hay.includes(x))
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

// 1. PR comments. The only surface that names the project, so this is the primary source.
async function fromPrComments() {
  if (!PR_NUMBER) return []
  const comments = await ghFetch(`/repos/${REPO}/issues/${PR_NUMBER}/comments?per_page=100`)
  const out = []
  for (const c of comments) {
    const url = extractPreviewUrl(c.body)
    if (!url) continue
    const project = (c.body || '').match(/Deploying\s+([a-z0-9._-]+)\s+with/i)?.[1] ?? null
    out.push({ project, url, source: `pr-comment(${c.user?.login ?? '?'})` })
  }
  return out
}

// 2. GitHub deployments → statuses → environment_url (Workers-Builds-style setups).
async function fromDeployments() {
  const deployments = await ghFetch(`/repos/${REPO}/deployments?sha=${SHA}&per_page=100`)
  const out = []
  for (const d of deployments) {
    const statuses = await ghFetch(`/repos/${REPO}/deployments/${d.id}/statuses?per_page=100`)
    for (const s of statuses) {
      const url = extractPreviewUrl(s.environment_url) || extractPreviewUrl(s.target_url)
      if (url) out.push({ project: d.environment ?? null, url, source: 'deployment' })
    }
  }
  return out
}

// 3. Commit statuses → target_url / description.
async function fromCommitStatuses() {
  const statuses = await ghFetch(`/repos/${REPO}/commits/${SHA}/statuses?per_page=100`)
  return statuses
    .map((s) => extractPreviewUrl(s.target_url) || extractPreviewUrl(s.description))
    .filter(Boolean)
    .map((url) => ({ project: null, url, source: 'commit-status' }))
}

// 4. Check runs → output.{summary,text,title} / details_url (no project name here).
async function fromCheckRuns() {
  const { check_runs: runs = [] } = await ghFetch(
    `/repos/${REPO}/commits/${SHA}/check-runs?per_page=100`,
  )
  const out = []
  for (const r of runs) {
    const url =
      extractPreviewUrl(r.output?.summary) ||
      extractPreviewUrl(r.output?.text) ||
      extractPreviewUrl(r.output?.title) ||
      extractPreviewUrl(r.details_url)
    if (url) out.push({ project: r.name ?? null, url, source: `check-run(${r.name ?? '?'})` })
  }
  return out
}

async function discoverUrl() {
  const candidates = []
  for (const source of [fromPrComments, fromDeployments, fromCommitStatuses, fromCheckRuns]) {
    try {
      candidates.push(...(await source()))
    } catch (err) {
      console.error(`discovery (${source.name}): ${err.message}`)
    }
  }

  for (const c of candidates) {
    if (matchesTarget(c.project, c.url)) {
      console.error(`selected ${c.url} [${c.source}, project=${c.project ?? '?'}]`)
      return c.url
    }
    console.error(`skipping ${c.url} [${c.source}, project=${c.project ?? '?'}] — not the target project`)
  }
  return null
}

async function waitReachable(url) {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS
  let attempt = 0
  while (Date.now() < deadline) {
    attempt++
    try {
      const res = await fetch(`${url}${HEALTH_PATH}`, { signal: AbortSignal.timeout(10_000) })
      // Any HTTP response counts as reachable, on purpose (see
      // docs/cloudflare-previews-ci.md). The smoke specs catch a 500, not discovery.
      console.error(`reachable (HTTP ${res.status}) after ${attempt} attempt(s)`)
      return true
    } catch (err) {
      console.error(`reachability attempt ${attempt}: ${err.message}`)
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
  console.error(
    `discovery target: ${CF_PROJECT_MATCH ? `project~"${CF_PROJECT_MATCH}"` : `any preview except [${EXCLUDE.join(', ')}]`}`,
  )

  const deadline = Date.now() + DISCOVER_TIMEOUT_MS
  let url = null
  while (Date.now() < deadline) {
    url = await discoverUrl()
    if (url) break
    console.error('no matching Cloudflare web-app preview on the PR yet...')
    await sleep(POLL_INTERVAL_MS)
  }

  if (!url) {
    console.error('No matching Cloudflare web-app preview found within timeout — skipping smoke.')
    exportUrl('')
    return
  }

  console.error(`preview URL: ${url}`)
  if (!(await waitReachable(url))) {
    console.error('Preview environment never became reachable.')
    process.exit(1)
  }
  exportUrl(url)
  console.log(url)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
