#!/usr/bin/env node
// WeMeditateWeb folder reorganisation: file moves + `@/` import rewrite.
// Idempotent: a move whose source is gone is skipped, and an `@/` import is
// re-mapped through the same table, so it can be re-run on any branch.
//
//   node scripts/reorg/moves.mjs <repo-root> [--dry]
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? '.')
const dry = process.argv.includes('--dry')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' })

/** [old, new]. A directory moves whole. A file brings its `<base>.test.ts(x)` and `<base>.*.test.ts(x)`. */
const MOVES = [
  // SahajCloud types leave server/
  ['server/payload-types.ts', 'types/payload/payload-types.ts'],
  ['server/atlas-types.ts', 'types/atlas.ts'],
  ['server/sahajcloud-types.ts', 'types/sahajcloud.ts'],
  // The SahajCloud client and its transport
  ['server/sahajcloud-client.ts', 'server/sahajcloud/client.ts'],
  ['server/payload-client.ts', 'server/sahajcloud/payload-client.ts'],
  ['server/sahajcloud-fetch.ts', 'server/sahajcloud/fetch.ts'],
  ['server/sahajcloud-context.ts', 'server/sahajcloud/context.ts'],
  ['server/atlas-client.ts', 'server/sahajcloud/atlas.ts'],
  // Non-/api routes, one folder each
  ['server/oembed-routes.ts', 'server/routes/oembed/route.ts'],
  ['server/oembed.ts', 'server/routes/oembed/oembed.ts'],
  ['server/sitemap-routes.ts', 'server/routes/sitemap.xml/route.ts'],
  ['server/sitemap.ts', 'server/routes/sitemap.xml/sitemap.ts'],
  ['server/manifest.ts', 'server/routes/manifest.webmanifest/manifest.ts'],
  // lib/ by topic
  ['lib/content-seo.ts', 'lib/seo/content-seo.ts'],
  ['lib/seo-head-html.ts', 'lib/seo/head-html.ts'],
  ['lib/seo-schema.ts', 'lib/seo/schema.ts'],
  ['lib/structured-data.ts', 'lib/seo/structured-data.ts'],
  ['lib/head.tsx', 'lib/seo/head.tsx'],
  ['lib/head-settings.ts', 'lib/seo/head-settings.ts'],
  ['lib/hreflang.ts', 'lib/seo/hreflang.ts'],
  ['lib/site-identity.ts', 'lib/seo/site-identity.ts'],
  ['lib/i18n.ts', 'lib/i18n/i18n.ts'],
  ['lib/translations.en.json', 'lib/i18n/translations.en.json'],
  ['lib/locale-names.ts', 'lib/i18n/locale-names.ts'],
  ['lib/error-keys.ts', 'lib/errors/error-keys.ts'],
  ['lib/urls.ts', 'lib/urls/urls.ts'],
  ['lib/document-routes.ts', 'lib/urls/document-routes.ts'],
  ['lib/slugify.ts', 'lib/urls/slugify.ts'],
  ['lib/atlas-route.ts', 'lib/atlas/route.ts'],
  ['lib/atlas-embed.ts', 'lib/atlas/embed.ts'],
  ['lib/atlas-seo.ts', 'lib/atlas/seo.ts'],
  ['lib/content-blocks.ts', 'lib/content/blocks.ts'],
  ['lib/lecture-shape.ts', 'lib/content/lecture-shape.ts'],
  ['lib/related-content.ts', 'lib/content/related-content.ts'],
  ['lib/payload-relationships.ts', 'lib/content/payload-relationships.ts'],
  ['lib/paragraphs.ts', 'lib/content/paragraphs.ts'],
  ['lib/page-tag-labels.ts', 'lib/content/page-tag-labels.ts'],
  ['lib/featured-nav.ts', 'lib/content/featured-nav.ts'],
  ['lib/submissions.ts', 'lib/forms/submissions.ts'],
  ['lib/cloudflare-images.ts', 'lib/media/cloudflare-images.ts'],
  ['lib/embed-player.ts', 'lib/media/embed-player.ts'],
  ['lib/duration', 'lib/media/duration'],
  ['components/molecules/AudioPlayer/types.ts', 'lib/media/audio.ts'],
  ['lib/route-announcer.ts', 'lib/a11y/route-announcer.ts'],
  ['lib/sentry-data-collection.ts', 'lib/sentry/data-collection.ts'],
  ['sentry.browser.config.ts', 'lib/sentry/browser-config.ts'],
  // A folder per template, like every other component
  [
    'components/templates/LectureTemplate.tsx',
    'components/templates/LectureTemplate/LectureTemplate.tsx',
  ],
  [
    'components/templates/MeditationTemplate.tsx',
    'components/templates/MeditationTemplate/MeditationTemplate.tsx',
  ],
  ['components/templates/PageTemplate.tsx', 'components/templates/PageTemplate/PageTemplate.tsx'],
  // Reference docs into docs/
  ['DESIGN_SYSTEM.md', 'docs/DESIGN_SYSTEM.md'],
  ['STORYBOOK.md', 'docs/STORYBOOK.md'],
  ['MCP_USAGE.md', 'docs/MCP_USAGE.md'],
]

/** Where a file may import through `@/`. Everything else (scripts, configs, eslint-rules) stays relative. */
const ALIAS_DIRS = [
  'components/',
  'hooks/',
  'layouts/',
  'lib/',
  'pages/',
  'server/',
  'tests/',
  'types/',
]
const ALIAS_FILES = ['.ladle/components.tsx']
const CODE = /\.(ts|tsx|mts|cts|js|mjs|cjs|jsx)$/
const RESOLVE_EXTS = [
  '',
  '.ts',
  '.tsx',
  '.d.ts',
  '.js',
  '.mjs',
  '.jsx',
  '.json',
  '/index.ts',
  '/index.tsx',
  '/index.js',
]

// This folder names every old path on purpose, so it is never rewritten.
const SELF = 'scripts/reorg/'
const tracked = git('ls-files')
  .split('\n')
  .filter((f) => f && !f.startsWith(SELF))
const trackedSet = new Set(tracked)

// --- old → new, as a function of the path alone (so a re-run still maps) ---
const strip = (n) => n.replace(/\.(tsx?|json|md)$/, '')

function mapOld(p) {
  for (const [from, to] of MOVES) {
    if (p === from) return to
    if (p.startsWith(from + '/')) return to + p.slice(from.length)
    const dir = path.posix.dirname(from)
    const base = strip(path.posix.basename(from))
    const name = path.posix.basename(p)

    if (
      path.posix.dirname(p) === dir &&
      /\.test\.tsx?$/.test(name) &&
      name.startsWith(base + '.') &&
      from !== p
    ) {
      if (/\.(md|json)$/.test(from) || from.endsWith('/')) continue
      return `${path.posix.dirname(to)}/${strip(path.posix.basename(to))}${name.slice(base.length)}`
    }
  }

  return null
}

const oldToNew = new Map()

for (const f of tracked) {
  const n = mapOld(f)
  if (n) oldToNew.set(f, n)
}

const newToOld = new Map([...oldToNew].map(([o, n]) => [n, o]))

for (const n of newToOld.keys()) {
  if (trackedSet.has(n) && !oldToNew.has(n)) throw new Error(`destination already tracked: ${n}`)
}

const mapPath = (p) => mapOld(p) ?? p

// --- move --------------------------------------------------------------------
for (const [o, n] of oldToNew) {
  if (!trackedSet.has(o)) continue
  if (dry) {
    console.log(`mv ${o} -> ${n}`)
    continue
  }
  mkdirSync(path.join(root, path.posix.dirname(n)), { recursive: true })
  git('mv', o, n)
}

// --- rewrite -----------------------------------------------------------------
/** The file a specifier names, as an *old* path, or null. Handles a `.js` spelling of a `.ts` file. */
function resolveOld(fromOldDir, spec) {
  const [bare, query = ''] = spec.split(/(?=\?)/)
  const target = bare.startsWith('@/')
    ? bare.slice(2)
    : path.posix.normalize(path.posix.join(fromOldDir, bare))
  const exists = (p) =>
    trackedSet.has(p) || (existsSync(path.join(root, p)) && statSync(path.join(root, p)).isFile())
  const tries = RESOLVE_EXTS.map((ext) => ({ path: target + ext, ext, js: false }))

  if (target.endsWith('.js')) {
    for (const ext of ['.ts', '.tsx'])
      tries.push({ path: target.slice(0, -3) + ext, ext, js: true })
  }

  for (const t of tries) {
    const now = mapPath(t.path)
    if (exists(now) && !now.endsWith('/')) {
      return { old: t.path, ext: t.ext, query, explicit: t.ext === '' && !t.js, js: t.js }
    }
  }

  return null
}

function rewriteSpec(fileOld, fileNew, spec) {
  if (!(spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('@/'))) return spec
  const hit = resolveOld(path.posix.dirname(fileOld), spec)

  if (!hit) return spec
  let target = mapPath(hit.old)

  // Keep the specifier's own spelling of the extension and the index.
  if (hit.js) {
    target = target.replace(/\.tsx?$/, '.js')
  } else if (!hit.explicit) {
    if (hit.ext.startsWith('/index')) target = path.posix.dirname(target)
    else target = target.slice(0, target.length - hit.ext.length)
  }

  const fromDir = path.posix.dirname(fileNew)
  const aliased = ALIAS_DIRS.some((d) => fileNew.startsWith(d)) || ALIAS_FILES.includes(fileNew)
  const inside = target === fromDir || target.startsWith(fromDir + '/')
  let out

  if (aliased && !inside) {
    out = '@/' + target
  } else {
    out = path.posix.relative(fromDir, target)
    if (!out.startsWith('.')) out = './' + out
  }

  return out + hit.query
}

const SPEC =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\bvi\.(?:mock|doMock|unmock|importActual|importMock)\s*\(\s*|\brequire\s*\(\s*|\bexport\s+\*\s+from\s*)(['"])([^'"\n]+)\2/g

const filesNow = dry
  ? tracked
  : git('ls-files')
      .split('\n')
      .filter((f) => f && !f.startsWith(SELF))
let changed = 0

for (const fileNew of filesNow) {
  const fileOld = newToOld.get(fileNew) ?? fileNew
  const abs = path.join(root, dry ? fileOld : fileNew)

  if (!existsSync(abs)) continue
  const isCode = CODE.test(fileNew) && fileNew !== 'types/payload/payload-types.ts'
  const isMd = fileNew.endsWith('.md')

  if (!isCode && !isMd) continue
  const before = readFileSync(abs, 'utf8')
  let after = before

  if (isCode) {
    after = after.replace(
      SPEC,
      (all, lead, q, spec) => lead + q + rewriteSpec(fileOld, fileNew, spec) + q,
    )
  }

  if (isMd) {
    after = after.replace(/\]\(([^)\s#]+)(#[^)\s]*)?\)/g, (all, link, hash = '') => {
      if (/^[a-z]+:/i.test(link) || link.startsWith('/')) return all
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(fileOld), link))
      const isDir = tracked.some((f) => f.startsWith(target.replace(/\/$/, '') + '/'))

      if (!trackedSet.has(target) && !isDir) return all
      const moved = trackedSet.has(target) ? mapPath(target) : target
      let rel = path.posix.relative(path.posix.dirname(fileNew), moved) || '.'

      if (link.endsWith('/')) rel += '/'

      return `](${rel}${hash})`
    })
  }

  if (after !== before) {
    changed += 1
    if (dry) console.log(`rewrite ${fileNew}`)
    else writeFileSync(abs, after)
  }
}

// --- prose: repo-relative paths in any tracked text file --------------------
// A slashless (root) name is too common a word in prose to rewrite blind; those are fixed by hand.
const moves = [...new Set([...oldToNew.keys(), ...MOVES.map(([o]) => o)])]
  .filter((o) => o.includes('/'))
  .sort((a, b) => b.length - a.length)
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const PROSE = new RegExp(
  `(?<![A-Za-z0-9_@-])(${moves.map(escape).join('|')})(?![A-Za-z0-9_-])`,
  'g',
)
const TEXT =
  /\.(ts|tsx|mts|js|mjs|cjs|jsx|md|json|jsonc|yml|yaml|toml|css|sh)$|^\.prettierignore$|(^|\/)\.gitignore$/

for (const fileNew of filesNow) {
  if (!TEXT.test(fileNew) && !TEXT.test(path.posix.basename(fileNew))) continue
  if (fileNew === 'pnpm-lock.yaml' || fileNew === 'types/payload/payload-types.ts') continue
  const abs = path.join(root, dry ? (newToOld.get(fileNew) ?? fileNew) : fileNew)

  if (!existsSync(abs)) continue
  const before = readFileSync(abs, 'utf8')
  const after = before.replace(PROSE, (p, _g, offset, whole) => {
    const to = mapPath(p)
    // Already the new spelling (the old path is a suffix of the new one): leave it.
    const start = offset - (to.length - p.length)

    return start >= 0 && whole.slice(start, offset + p.length) === to ? p : to
  })

  if (after !== before) {
    if (dry) console.log(`prose ${fileNew}`)
    else writeFileSync(abs, after)
  }
}

console.log(`${oldToNew.size} moves, ${changed} files with rewritten imports or links`)
