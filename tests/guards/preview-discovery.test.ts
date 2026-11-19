/**
 * Preview discovery must never hand the smoke specs a dead address, and must still find the
 * live one when Cloudflare posts no comment for it.
 *
 * Both of this repo's previews are Workers. A pull request opened before 2026-11-02 still
 * carries the old `wemeditate-design` Cloudflare *Pages* comment, whose `wm-design.pages.dev`
 * host no longer resolves. It matched the target by project name and sorted first, so
 * `Smoke (ladle)` spent its whole reachability budget on it and failed (#184). Cloudflare posts
 * no comment for the Worker on such a pull request, which leaves the branch host as the only
 * address left to spell.
 */
import { describe, it, expect, beforeAll } from 'vitest'

const SCRIPT = new URL('../../scripts/get-cloudflare-preview-url.mjs', import.meta.url).href

const WORKER = 'wemeditate-design'
const BRANCH = 'claude/fix-135-carousel-dot-cells'

let discovery: any

beforeAll(async () => {
  process.env.CF_PROJECT_MATCH = WORKER
  process.env.PR_HEAD_REF = BRANCH
  discovery = await import(SCRIPT)
})

describe('preview URL extraction', () => {
  it('ignores a pages.dev host', () => {
    expect(discovery.extractPreviewUrl("<a href='https://8c49b588.wm-design.pages.dev'>")).toBeNull()
  })

  it('reads a Workers preview host out of a bot comment', () => {
    expect(
      discovery.extractPreviewUrl(
        "| wemeditate-web | d0b927db | <a href='https://2ee3aa83-wemeditate-web.contact-c66.workers.dev'>Commit Preview URL</a>",
      ),
    ).toBe('https://2ee3aa83-wemeditate-web.contact-c66.workers.dev')
  })
})

describe('the derived branch host', () => {
  it('spells the target Worker from another preview found on the same pull request', () => {
    expect(
      discovery.fromDerivedBranchHost([
        { url: 'https://2ee3aa83-wemeditate-web.contact-c66.workers.dev' },
      ]),
    ).toEqual([
      {
        project: WORKER,
        url: `https://claude-fix-135-carousel-dot-cells-${WORKER}.contact-c66.workers.dev`,
        source: 'derived-branch-host',
      },
    ])
  })

  it('derives nothing when no account subdomain is in evidence', () => {
    expect(discovery.fromDerivedBranchHost([])).toEqual([])
    expect(
      discovery.fromDerivedBranchHost([{ url: 'https://8c49b588.wm-design.pages.dev' }]),
    ).toEqual([])
  })

  it('slugifies a branch the way Cloudflare does', () => {
    // Both halves are the real Branch Preview URL Cloudflare posted for these branches.
    expect(discovery.slugifyBranch('claude/feat-82-vidstack-labels')).toBe(
      'claude-feat-82-vidstack-labels',
    )
    expect(discovery.slugifyBranch(BRANCH)).toBe('claude-fix-135-carousel-dot-cells')
  })
})

describe('the commit a preview comment names', () => {
  // Cloudflare's real comment for this pull request, one Worker's row.
  const comment = (sha: string) =>
    `| Status | Name | Latest Commit | Preview URL | Updated (UTC) |\n| -|-|-|-|-|\n` +
    `| ✅ Deployment successful! <br>[View logs](https://dash.cloudflare.com/?to=/c66c53a69689eb030b228c450515fff2/workers/services/view/wemeditate-web/production/builds/3e67b208-bec5-4c58-acb0-808cd52fdc30) ` +
    `| wemeditate-web | ${sha} | <a href='https://786c3f75-wemeditate-web.contact-c66.workers.dev'>Commit Preview URL</a> | Nov 19 2026, 03:58 AM |`

  const HEAD = 'c221df7f593aca1e0b85ba31ecd7d0fc190cf8d3'

  it('accepts the short SHA of the commit under test', () => {
    expect(discovery.namesCommit(comment('c221df7f'), HEAD)).toBe(true)
  })

  it('refuses the commit before it, whose address the comment still carries', () => {
    expect(discovery.namesCommit(comment('b60f0acf'), HEAD)).toBe(false)
  })

  it('reads the commit cell, not the account or build id beside it', () => {
    // Both are hex runs in the same comment, and neither is a cell of its own.
    expect(discovery.namesCommit(comment('c221df7f'), 'c66c53a69689eb030b228c450515fff2')).toBe(
      false,
    )
  })

  it('accepts a comment that names no commit, and any comment when the SHA is unknown', () => {
    expect(discovery.namesCommit('https://x-wemeditate-web.contact-c66.workers.dev', HEAD)).toBe(
      true,
    )
    expect(discovery.namesCommit(comment('b60f0acf'), undefined)).toBe(true)
  })
})

describe('target matching', () => {
  it('keeps the two Workers apart', () => {
    expect(
      discovery.matchesTarget(null, 'https://2ee3aa83-wemeditate-web.contact-c66.workers.dev'),
    ).toBe(false)
    expect(
      discovery.matchesTarget(null, `https://2ee3aa83-${WORKER}.contact-c66.workers.dev`),
    ).toBe(true)
  })
})
