#!/usr/bin/env node
// Re-points named imports of symbols that moved out of a module.
//   node scripts/reorg/split-imports.mjs <repo-root>
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] ?? '.')

/** module → { symbol → new module } */
const MOVED = {
  'types/sahajcloud.ts': Object.fromEntries([
    ...[
      'KNOWN_LOCALES',
      'LOCALES',
      'isLocale',
      'DEFAULT_LOCALE',
      'parseLocale',
      'localeDirection',
    ].map((s) => [s, 'lib/i18n/locales.ts']),
    ...['WEB_TRANSLATIONS_SELECT', 'WebTranslations'].map((s) => [
      s,
      'lib/i18n/web-translations.ts',
    ]),
  ]),
  'server/error-utils.ts': Object.fromEntries(
    ['ErrorType', 'readStatus', 'detectErrorType'].map((s) => [s, 'lib/errors/error-type.ts']),
  ),
  'server/routes/sitemap.xml/sitemap.ts': { isCanonicalOrigin: 'lib/seo/canonical-origin.ts' },
}

const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .filter(
    (f) =>
      /\.(ts|tsx|mjs)$/.test(f) &&
      !f.startsWith('types/payload/') &&
      !f.startsWith('scripts/reorg/'),
  )

function resolve(from, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return null
  const base = spec.startsWith('@/')
    ? spec.slice(2)
    : path.posix.normalize(path.posix.join(path.posix.dirname(from), spec))

  for (const ext of ['', '.ts', '.tsx']) {
    const p = base + ext
    if (MOVED[p]) return p
  }

  return null
}

function specFor(from, target, styleSpec) {
  const fromDir = path.posix.dirname(from)
  const aliased = !from.startsWith('scripts/')
  const keepExt = /\.tsx?$/.test(styleSpec)
  const t = keepExt ? target : target.replace(/\.tsx?$/, '')

  if (aliased && path.posix.dirname(target) !== fromDir) return '@/' + t
  let rel = path.posix.relative(fromDir, t)

  return rel.startsWith('.') ? rel : './' + rel
}

const DECL = /import\s+(type\s+)?\{([^}]*)\}\s*from\s*(['"])([^'"]+)\3;?/g
let touched = 0

for (const file of files) {
  const abs = path.join(root, file)
  if (!existsSync(abs)) continue
  const before = readFileSync(abs, 'utf8')
  const after = before.replace(DECL, (all, typeKw = '', names, q, spec) => {
    const mod = resolve(file, spec)
    if (!mod) return all
    const keep = []
    const out = new Map()

    for (const raw of names
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)) {
      const name = raw.replace(/^type\s+/, '').split(/\s+as\s+/)[0]
      const target = MOVED[mod][name]

      if (target && target !== file) {
        if (!out.has(target)) out.set(target, [])
        out.get(target).push(raw)
      } else keep.push(raw)
    }

    if (out.size === 0) return all
    const lines = []

    if (keep.length) lines.push(`import ${typeKw}{ ${keep.join(', ')} } from ${q}${spec}${q}`)
    for (const [target, list] of out) {
      lines.push(
        `import ${typeKw}{ ${list.join(', ')} } from ${q}${specFor(file, target, spec)}${q}`,
      )
    }

    return lines.join('\n')
  })

  if (after !== before) {
    writeFileSync(abs, after)
    touched += 1
  }
}

console.log(`${touched} files re-pointed`)
