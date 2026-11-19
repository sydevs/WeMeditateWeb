/**
 * The contract gate's summary must name each key that drifted, in the terms a reviewer reads the
 * contract in — a translation key path, a type member — and never call a drifted file a match.
 * The fixtures copy the real drift of 2026-11-19: `wisdom_sidetext` hand-added ahead of
 * sydevs/SahajCloud#1218, `menu` and `occurrence` merged upstream and not yet synced.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CONTRACTS, report, summarize, translationDrift, typeDrift } from './contract-drift'

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`

const COMMITTED_MIRROR = json({
  blocks: { general: { seconds: 'Seconds', wisdom_sidetext: 'Ancient Wisdom' } },
  common: {
    a11y: {
      close: 'Close',
      opens_in_new_tab: '%{label} (opens in new tab)',
    },
  },
  lecture: { a11y: { untitled_heading: 'Untitled talk' } },
})

const GENERATED_MIRROR = json({
  blocks: { general: { seconds: 'Seconds' } },
  common: { a11y: { close: 'Close', menu: 'Menu' } },
  lecture: { a11y: { untitled_heading: 'Untitled Lecture' } },
})

const COMMITTED_TYPES = `export type TableOfContentsHeadings = {
  slug: string;
  level: number;
  [k: string]: unknown;
}[];
export interface Page {
  id: number;
  meta?: {
    /**
     * Shown in search results.
     */
    title?: string | null;
  };
}
export interface WmWebTranslationsBlocksGeneralStrings {
  seconds?: string;
  /**
   * Ornamental words set on their side along the outer edge of an “Ancient Wisdom” text box.
   */
  wisdom_sidetext?: string;
}
export interface RetiredStrings {
  one?: string;
  two?: string;
}
`

describe('translationDrift', () => {
  it('names each translation key that was removed, added or reworded', () => {
    const { changes } = translationDrift(COMMITTED_MIRROR, GENERATED_MIRROR)

    expect(changes).toEqual([
      { committed: '"Ancient Wisdom"', key: 'blocks.general.wisdom_sidetext', kind: 'removed' },
      {
        committed: '"%{label} (opens in new tab)"',
        key: 'common.a11y.opens_in_new_tab',
        kind: 'removed',
      },
      {
        committed: '"Untitled talk"',
        generated: '"Untitled Lecture"',
        key: 'lecture.a11y.untitled_heading',
        kind: 'changed',
      },
      { generated: '"Menu"', key: 'common.a11y.menu', kind: 'added' },
    ])
  })

  it('tells a committed file laid out by hand from one the generator wrote', () => {
    const misindented = COMMITTED_MIRROR.replace('      "close"', '    "close"')

    expect(translationDrift(COMMITTED_MIRROR, GENERATED_MIRROR).formatting).toBe(false)
    expect(translationDrift(misindented, GENERATED_MIRROR).formatting).toBe(true)
    expect(translationDrift(misindented, COMMITTED_MIRROR)).toEqual({
      changes: [],
      formatting: true,
    })
  })
})

describe('typeDrift', () => {
  it('keys a member of an inline array type under its alias', () => {
    const generated = COMMITTED_TYPES.replace(
      '  level: number;\n',
      '  level: number;\n  occurrence?: number;\n',
    )

    expect(typeDrift(COMMITTED_TYPES, generated).changes).toEqual([
      {
        generated: 'occurrence?: number;',
        key: 'TableOfContentsHeadings[].occurrence',
        kind: 'added',
      },
    ])
  })

  it('names a removed interface member by interface and member', () => {
    const generated = COMMITTED_TYPES.replace(
      /  \/\*\*\n   \* Ornamental[^]*?wisdom_sidetext\?: string;\n/,
      '',
    )

    expect(typeDrift(COMMITTED_TYPES, generated).changes).toEqual([
      {
        committed: 'wisdom_sidetext?: string;',
        key: 'WmWebTranslationsBlocksGeneralStrings.wisdom_sidetext',
        kind: 'removed',
      },
    ])
  })

  it('reports a change inside a nested object on the member that changed, not on its parent', () => {
    const generated = COMMITTED_TYPES.replace('title?: string | null;', 'title?: string;')

    expect(typeDrift(COMMITTED_TYPES, generated).changes).toEqual([
      {
        committed: 'title?: string | null;',
        generated: 'title?: string;',
        key: 'Page.meta.title',
        kind: 'changed',
      },
    ])
  })

  it('reports a reworded description apart from a changed type', () => {
    const generated = COMMITTED_TYPES.replace(
      'Shown in search results.',
      'Shown by search engines.',
    )

    expect(typeDrift(COMMITTED_TYPES, generated).changes).toEqual([
      { key: 'Page.meta.title', kind: 'redescribed' },
    ])
  })

  it('names a removed interface once, not once per member', () => {
    const generated = COMMITTED_TYPES.replace(/export interface RetiredStrings \{[^}]*\}\n/, '')

    expect(typeDrift(COMMITTED_TYPES, generated).changes).toEqual([
      {
        committed: 'export interface RetiredStrings { … }',
        key: 'RetiredStrings',
        kind: 'removed',
      },
    ])
  })
})

describe('summarize', () => {
  it('says a matching file matches, and nothing else', () => {
    const summary = summarize('server/payload-types.ts', COMMITTED_TYPES, COMMITTED_TYPES)

    expect(summary).toContain('✅ Matches what `pnpm types:cms` writes from SahajCloud `main`.')
    expect(summary).not.toContain('❌')
  })

  it('lists every drifted key under what happened to it, and the one fix', () => {
    const summary = summarize('lib/translations.en.json', COMMITTED_MIRROR, GENERATED_MIRROR)

    expect(summary).toContain('❌ Differs from what')
    expect(summary).toContain(
      '**Only in the committed file** (2)\n\n- `blocks.general.wisdom_sidetext`: `"Ancient Wisdom"`\n',
    )
    expect(summary).toContain(
      '**Only in the generated file** (1)\n\n- `common.a11y.menu`: `"Menu"`',
    )
    expect(summary).toContain(
      '- `lecture.a11y.untitled_heading`: `"Untitled talk"` → `"Untitled Lecture"`',
    )
    expect(summary).toContain(
      'Land the change in SahajCloud first, then run `PUBLIC__SAHAJCLOUD_URL=https://cloud.sydevelopers.com pnpm sync:translations`',
    )
  })

  it('never calls a file that differs only in layout a match', () => {
    const summary = summarize('lib/translations.en.json', `${COMMITTED_MIRROR}\n`, COMMITTED_MIRROR)

    expect(summary).toContain('❌ Differs from what')
    expect(summary).toContain('No key differs: the difference is in layout or comments.')
  })

  it('still fails readable when a side is not valid JSON', () => {
    const summary = summarize('lib/translations.en.json', '{ "broken": ', GENERATED_MIRROR)

    expect(summary).toContain('❌ Differs from what')
    expect(summary).toContain('It could not be compared key by key')
  })

  it('cuts a long list short and says how many it left out', () => {
    const many = json({
      group: Object.fromEntries(Array.from({ length: 45 }, (_, i) => [`k${i}`, 'x'])),
    })
    const summary = summarize('lib/translations.en.json', json({}), many)

    expect(summary).toContain('**Only in the generated file** (45)')
    expect(summary).toContain('- `group.k39`: `"x"`')
    expect(summary).not.toContain('- `group.k40`')
    expect(summary).toContain('- …and 5 more: read the diff in the step log.')
  })
})

describe('report', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { force: true, recursive: true })
    dir = undefined
    vi.restoreAllMocks()
  })

  /** A repository whose index holds `committed` and whose working tree holds `generated`. */
  function checkout(committed: string, generated: string): string {
    dir = mkdtempSync(join(tmpdir(), 'contract-drift-'))
    mkdirSync(join(dir, 'lib'))
    writeFileSync(join(dir, 'lib/translations.en.json'), committed)
    execFileSync('git', ['init', '--quiet'], { cwd: dir })
    execFileSync('git', ['add', 'lib/translations.en.json'], { cwd: dir })
    writeFileSync(join(dir, 'lib/translations.en.json'), generated)

    return dir
  }

  it('compares the index with the working tree, as git diff does, and annotates the drift', () => {
    const cwd = checkout(COMMITTED_MIRROR, GENERATED_MIRROR)
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    report('lib/translations.en.json', cwd, join(cwd, 'summary.md'))

    expect(readFileSync(join(cwd, 'summary.md'), 'utf8')).toContain('`common.a11y.menu`')
    expect(stdout).toHaveBeenCalledWith(
      expect.stringMatching(
        /^::error file=lib\/translations\.en\.json,title=SahajCloud contract drift::/,
      ),
    )
  })

  it('raises no annotation when the generator wrote what is committed', () => {
    const cwd = checkout(COMMITTED_MIRROR, COMMITTED_MIRROR)
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    report('lib/translations.en.json', cwd, join(cwd, 'summary.md'))

    expect(readFileSync(join(cwd, 'summary.md'), 'utf8')).toContain('✅ Matches')
    expect(stdout.mock.calls.flat().join('')).not.toContain('::error')
  })

  it('refuses a file that is not a SahajCloud contract', () => {
    expect(() => report('package.json', process.cwd(), undefined)).toThrow(
      'Not a SahajCloud contract file',
    )
  })
})

describe('the gate steps that run it', () => {
  const lines = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8')
    .split('\n')
    .map((line) => line.trim())

  it('diff every contract file after regenerating it', () => {
    for (const path of Object.keys(CONTRACTS)) {
      expect(lines).toContain(`git diff --exit-code ${path}`)
    }
  })

  it('cut each fetch off, so a stalled one is retried instead of running into the job timeout', () => {
    const fetches = lines.filter((line) => /pnpm (types:cms|sync:translations)\b/.test(line))

    expect(fetches).toHaveLength(2)
    for (const line of fetches) expect(line).toMatch(/^timeout \d+ pnpm /)
  })

  it('leave the verdict to git diff when the summary itself cannot run', () => {
    const summaries = lines.filter((line) => line.includes('scripts/contract-drift.ts'))

    expect(summaries).toHaveLength(2)
    for (const line of summaries) expect(line).toMatch(/ \|\|$/)
  })
})
