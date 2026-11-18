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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
