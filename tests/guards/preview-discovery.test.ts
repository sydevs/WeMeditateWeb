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
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'

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
    expect(
      discovery.extractPreviewUrl("<a href='https://8c49b588.wm-design.pages.dev'>"),
    ).toBeNull()
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

describe('discovery against a pull request whose preview is mid-rebuild', () => {
  // The web Worker's comment on #284, as Cloudflare left it once 01947eb6 had built. That
  // commit's job 135332006782 ran a minute earlier and smoked the d3499ab5 row's address.
  const HEAD = '01947eb6e89efcddc1638c40671ea861e185e778'
  const PREVIOUS = 'd3499ab5'
  const FRESH = 'https://fbf316a0-wemeditate-web.contact-c66.workers.dev'
  const STALE = 'https://37de6e0a-wemeditate-web.contact-c66.workers.dev'
  const BRANCH_HOST =
    'https://claude-feat-278-a11y-skip-link-nav-names-wemeditate-web.contact-c66.workers.dev'

  const botComment = (sha: string, host: string) => ({
    user: { login: 'cloudflare-workers-and-pages[bot]' },
    body:
      `## Deploying with &nbsp;<a href="https://workers.dev"><img alt="Cloudflare Workers" src="https://workers.cloudflare.com/logo.svg" width="16"></a> &nbsp;Cloudflare Workers\n` +
      `The latest updates on your project. Learn more about [integrating Git with Workers](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/).\n\n` +
      `| Status | Name | Latest Commit | Preview URL | Updated (UTC) |\n| -|-|-|-|-|\n` +
      `| ✅ Deployment successful! <br>[View logs](https://dash.cloudflare.com/?to=/c66c53a69689eb030b228c450515fff2/workers/services/view/wemeditate-web/production/builds/2445a28e-cf12-4c82-80bd-27127319d54e) ` +
      `| wemeditate-web | ${sha} | <a href='${host}'>Commit Preview URL</a><br><br><a href='${BRANCH_HOST}'>Branch Preview URL</a> | Nov 19 2026, 04:09 AM |`,
  })

  // The same build's check run, which GitHub serves by commit.
  const checkRun = {
    name: 'Workers Builds: wemeditate-web',
    details_url:
      'https://dash.cloudflare.com/c66c53a69689eb030b228c450515fff2/workers/services/view/wemeditate-web/production/builds/2445a28e-cf12-4c82-80bd-27127319d54e',
    output: {
      title: 'Workers Builds: wemeditate-web',
      summary: `\nVersion ID: fbf316a0-a3d5-4e72-99de-06e4613f8276\nPreview URL: ${FRESH}\nPreview Alias URL: ${BRANCH_HOST}\n`,
    },
  }

  interface Discovery {
    fromPrComments(): Promise<{ project: string | null; url: string; source: string }[]>
    discoverUrl(options?: { derive?: boolean }): Promise<string | null>
    waitReachable(url: string): Promise<boolean>
    main(): Promise<void>
  }

  let flow: Discovery
  let outDir = ''
  let probed: string[] = []

  beforeAll(async () => {
    const env = {
      GITHUB_TOKEN: 'test-token',
      GITHUB_REPOSITORY: 'sydevs/WeMeditateWeb',
      PR_HEAD_SHA: HEAD,
      PR_NUMBER: '284',
      PR_HEAD_REF: 'claude/feat-278-a11y-skip-link-nav-names',
      CF_PROJECT_MATCH: 'wemeditate-web',
      DISCOVER_TIMEOUT_MS: '200',
      HEALTH_TIMEOUT_MS: '50',
      POLL_INTERVAL_MS: '1',
    }

    // The script reads its configuration once, at import.
    for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value)
    vi.resetModules()
    flow = await import(SCRIPT)
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    if (outDir) rmSync(outDir, { recursive: true, force: true })
    outDir = ''
  })

  /** Serves the GitHub API for #284 and the preview hosts. `comments` is read once per poll. */
  function serve(comments: () => unknown[], { checkRuns = [] as unknown[], answers = true } = {}) {
    probed = []
    outDir ||= mkdtempSync(join(tmpdir(), 'preview-discovery-'))
    // CI sets both for the step running this suite; the script must not append to the real ones.
    vi.stubEnv('GITHUB_OUTPUT', join(outDir, 'output'))
    vi.stubEnv('GITHUB_ENV', join(outDir, 'env'))
    writeFileSync(join(outDir, 'output'), '')
    writeFileSync(join(outDir, 'env'), '')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})

    const json = (body: unknown) => Promise.resolve(Response.json(body))

    vi.stubGlobal('fetch', (input: string) => {
      const url = String(input)

      if (url.includes('.workers.dev')) {
        probed.push(url)

        return answers
          ? Promise.resolve(new Response(''))
          : Promise.reject(new TypeError('fetch failed'))
      }

      const path = url.replace('https://api.github.com/repos/sydevs/WeMeditateWeb', '')

      if (path === '/issues/284/comments?per_page=100') return json(comments())
      if (path === `/deployments?sha=${HEAD}&per_page=100`) return json([])
      if (path === `/commits/${HEAD}/statuses?per_page=100`) return json([])
      if (path === `/commits/${HEAD}/check-runs?per_page=100`) {
        return json({ check_runs: checkRuns })
      }

      return Promise.resolve(new Response('', { status: 404 }))
    })
  }

  const exported = () => ({
    output: readFileSync(join(outDir, 'output'), 'utf8'),
    env: readFileSync(join(outDir, 'env'), 'utf8'),
  })

  it('takes the comment row that names the commit under test', async () => {
    serve(() => [botComment('01947eb6', FRESH)])
    expect(await flow.fromPrComments()).toEqual([
      { project: null, url: FRESH, source: 'pr-comment(cloudflare-workers-and-pages[bot])' },
    ])
  })

  it('never takes a row that names the commit before it', async () => {
    serve(() => [botComment(PREVIOUS, STALE)])
    expect(await flow.fromPrComments()).toEqual([])
    expect(await flow.discoverUrl()).toBeNull()
    expect(await flow.discoverUrl({ derive: true })).toBeNull()
  })

  it('falls through to the check run GitHub serves for the commit', async () => {
    serve(() => [botComment(PREVIOUS, STALE)], { checkRuns: [checkRun] })
    expect(await flow.discoverUrl()).toBe(FRESH)
  })

  it('keeps polling inside the window until the row names the commit', async () => {
    let reads = 0

    serve(() => [reads++ < 2 ? botComment(PREVIOUS, STALE) : botComment('01947eb6', FRESH)])
    await flow.main()
    expect(reads).toBe(3)
    expect(exported()).toEqual({ output: `preview_url=${FRESH}\n`, env: `PREVIEW_URL=${FRESH}\n` })
    expect(probed).toEqual([`${FRESH}/`])
  })

  it('reports none, and probes nothing, when the row stays stale for the whole window', async () => {
    serve(() => [botComment(PREVIOUS, STALE)])
    await flow.main()
    expect(exported()).toEqual({ output: 'preview_url=\n', env: '' })
    expect(probed).toEqual([])
  })

  it('counts any HTTP answer as reachable, and gives up on a host that never answers', async () => {
    serve(() => [])
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 500 })))
    expect(await flow.waitReachable(FRESH)).toBe(true)

    serve(() => [], { answers: false })
    expect(await flow.waitReachable(FRESH)).toBe(false)
    expect(probed.length).toBeGreaterThan(0)
  })

  it('fails the step when the commit’s own preview never answers', async () => {
    serve(() => [botComment('01947eb6', FRESH)], { answers: false })
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit ${code}`)
    })
    await expect(flow.main()).rejects.toThrow('exit 1')
    expect(exported().output).toBe('')
    expect(new Set(probed)).toEqual(new Set([`${FRESH}/`]))
  })
})
