#!/usr/bin/env tsx
/**
 * Names, key by key, how a file SahajCloud generates for this repo differs from the copy
 * committed here, and writes that to the job summary. The `gate` job runs the generator first,
 * then this, then `git diff --exit-code` on the file — the diff is the verdict, and this is what
 * makes a red one readable without opening the log.
 *
 * Usage: tsx scripts/contract-drift.ts <server/payload-types.ts | lib/translations.en.json>
 *
 * The committed side is the git index (what `git diff` compares against), the generated side the
 * working tree. It only reports and never fails the job: a summary that crashed would otherwise
 * redden a step whose files match.
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import ts from 'typescript'

export type Change =
  | { committed: string; generated: string; key: string; kind: 'changed' }
  | { committed: string; key: string; kind: 'removed' }
  | { generated: string; key: string; kind: 'added' }
  | { key: string; kind: 'redescribed' }

interface Entry {
  doc: string
  value: string
}

interface Drift {
  changes: Change[]
  /** The committed file is not laid out the way the generator writes it. */
  formatting: boolean
}

interface Contract {
  command: string
  compare: (committed: string, generated: string) => Drift
  source: string
}

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim()

/** The keys `key` sits inside: `A[].b.c` → `A`, `A[].b`. */
function parentKeys(key: string): string[] {
  const parts = key.split('.')

  return parts.slice(1).map((_, index) =>
    parts
      .slice(0, index + 1)
      .join('.')
      .replace(/(#\d+)?(\[\])?$/, ''),
  )
}

/** A removed or added entry whose parent went the same way is implied by it. */
function withoutImpliedChildren(changes: Change[]): Change[] {
  const keysOf = (kind: Change['kind']) =>
    new Set(changes.filter((change) => change.kind === kind).map((change) => change.key))
  const sameWay = { added: keysOf('added'), removed: keysOf('removed') }

  return changes.filter(
    (change) =>
      (change.kind !== 'added' && change.kind !== 'removed') ||
      !parentKeys(change.key).some((parent) => sameWay[change.kind].has(parent)),
  )
}

function compareEntries(committed: Map<string, Entry>, generated: Map<string, Entry>): Change[] {
  const changes: Change[] = []

  for (const [key, before] of committed) {
    const after = generated.get(key)

    if (!after) changes.push({ committed: before.value, key, kind: 'removed' })
    else if (after.value !== before.value)
      changes.push({ committed: before.value, generated: after.value, key, kind: 'changed' })
    else if (after.doc !== before.doc) changes.push({ key, kind: 'redescribed' })
  }
  for (const [key, after] of generated) {
    if (!committed.has(key)) changes.push({ generated: after.value, key, kind: 'added' })
  }

  return withoutImpliedChildren(changes)
}

/** Recursively sorts object keys: `scripts/sync-translations.mjs` writes its snapshot this way. */
function sortDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortDeep((value as Record<string, unknown>)[key])]),
  )
}

function jsonLeaves(value: unknown, prefix = '', leaves = new Map<string, Entry>()) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, nested] of Object.entries(value)) {
      jsonLeaves(nested, prefix ? `${prefix}.${key}` : key, leaves)
    }
  } else {
    leaves.set(prefix, { doc: '', value: JSON.stringify(value) })
  }

  return leaves
}

/** The English mirror, compared as translation keys rather than as lines. */
export function translationDrift(committed: string, generated: string): Drift {
  const parsed = JSON.parse(committed) as unknown

  return {
    changes: compareEntries(jsonLeaves(parsed), jsonLeaves(JSON.parse(generated))),
    formatting: `${JSON.stringify(sortDeep(parsed), null, 2)}\n` !== committed,
  }
}

/** The object types written inline in `type`, outermost only: each one's members are entries of their own. */
function outerLiterals(type: ts.Node): ts.TypeLiteralNode[] {
  if (ts.isTypeLiteralNode(type)) return [type]

  const found: ts.TypeLiteralNode[] = []

  type.forEachChild((child) => {
    found.push(...outerLiterals(child))
  })

  return found
}

function memberName(member: ts.TypeElement, file: ts.SourceFile): string {
  if (ts.isIndexSignatureDeclaration(member)) {
    return `[${member.parameters.map((parameter) => parameter.getText(file)).join(', ')}]`
  }
  if (member.name && (ts.isStringLiteral(member.name) || ts.isNumericLiteral(member.name))) {
    return member.name.text
  }
  if (member.name) return member.name.getText(file)

  return collapse(member.getText(file))
}

/**
 * Every declaration and member of a generated types file, keyed by its path — `Page.meta.title`,
 * `TableOfContentsHeadings[].slug` — with its signature and its doc comment kept apart, so a
 * reworded description is not reported as a changed type.
 */
export function typeEntries(source: string): Map<string, Entry> {
  const file = ts.createSourceFile('contract.ts', source, ts.ScriptTarget.Latest, true)
  const entries = new Map<string, Entry>()
  const doc = (node: ts.Node) => collapse(source.slice(node.getFullStart(), node.getStart(file)))

  // A nested object type folds to `{…}` in its parent's signature, so a change inside it is
  // reported once, on the member that changed.
  const record = (key: string, node: ts.Node, type: ts.Node | undefined) => {
    const literals = type ? outerLiterals(type) : []
    let value = ''
    let at = node.getStart(file)

    for (const literal of literals) {
      value += `${source.slice(at, literal.getStart(file))}{…}`
      at = literal.getEnd()
    }
    entries.set(key, { doc: doc(node), value: collapse(value + source.slice(at, node.getEnd())) })

    literals.forEach((literal, index) => {
      const base = literals.length > 1 ? `${key}#${index + 1}` : key
      const prefix = ts.isArrayTypeNode(literal.parent) ? `${base}[]` : base

      for (const member of literal.members) recordMember(prefix, member)
    })
  }
  const recordMember = (prefix: string, member: ts.TypeElement) => {
    record(
      `${prefix}.${memberName(member, file)}`,
      member,
      ts.isPropertySignature(member) ? member.type : member,
    )
  }

  for (const statement of file.statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      const name = statement.name.text
      const head = source.slice(statement.getStart(file), statement.members.pos)

      entries.set(name, { doc: doc(statement), value: `${collapse(head)} … }` })
      for (const member of statement.members) recordMember(name, member)
    } else if (ts.isTypeAliasDeclaration(statement)) {
      record(statement.name.text, statement, statement.type)
    }
  }

  return entries
}

/** The generated types, compared declaration by declaration and member by member. */
export function typeDrift(committed: string, generated: string): Drift {
  return {
    changes: compareEntries(typeEntries(committed), typeEntries(generated)),
    formatting: false,
  }
}

export const CONTRACTS: Record<string, Contract> = {
  'lib/translations.en.json': {
    command: 'PUBLIC__SAHAJCLOUD_URL=https://cloud.sydevelopers.com pnpm sync:translations',
    compare: translationDrift,
    source: 'production SahajCloud',
  },
  'server/payload-types.ts': {
    command: 'pnpm types:cms',
    compare: typeDrift,
    source: 'SahajCloud `main`',
  },
}

/** Inline code that survives a backtick inside the text. */
function code(text: string): string {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length))
  const fence = '`'.repeat(longest + 1)
  const pad = text.startsWith('`') || text.endsWith('`') ? ' ' : ''

  return `${fence}${pad}${text}${pad}${fence}`
}

const SECTIONS: { heading: string; kind: Change['kind'] }[] = [
  { heading: 'Only in the committed file', kind: 'removed' },
  { heading: 'Only in the generated file', kind: 'added' },
  { heading: 'Different value', kind: 'changed' },
  { heading: 'Different description only', kind: 'redescribed' },
]

/** Lists past this many are cut short: the full diff is in the step log. */
const LIST_LIMIT = 40

function describeChange(change: Change): string {
  switch (change.kind) {
    case 'added':
      return `${code(change.key)}: ${code(change.generated)}`
    case 'removed':
      return `${code(change.key)}: ${code(change.committed)}`
    case 'changed':
      return `${code(change.key)}: ${code(change.committed)} → ${code(change.generated)}`
    case 'redescribed':
      return code(change.key)
  }
}

/** The job-summary section for one contract file. */
export function summarize(path: string, committed: string, generated: string): string {
  const contract = CONTRACTS[path]
  const title = `### SahajCloud contract: ${code(path)}`

  if (committed === generated) {
    return `${title}\n\n✅ Matches what ${code(contract.command)} writes from ${contract.source}.\n`
  }

  const lines = [
    title,
    '',
    `❌ Differs from what ${code(contract.command)} writes from ${contract.source}.`,
  ]
  let drift: Drift | undefined

  try {
    drift = contract.compare(committed, generated)
  } catch (error) {
    lines.push(
      '',
      `It could not be compared key by key (${String(error)}). Read the diff in the step log.`,
    )
  }

  if (drift) {
    for (const { heading, kind } of SECTIONS) {
      const matching = drift.changes.filter((change) => change.kind === kind)

      if (matching.length === 0) continue

      lines.push('', `**${heading}** (${matching.length})`, '')
      lines.push(...matching.slice(0, LIST_LIMIT).map((change) => `- ${describeChange(change)}`))
      if (matching.length > LIST_LIMIT) {
        lines.push(`- …and ${matching.length - LIST_LIMIT} more: read the diff in the step log.`)
      }
    }
    if (drift.changes.length === 0) {
      lines.push(
        '',
        'No key differs: the difference is in layout or comments. Read the diff in the step log.',
      )
    } else if (drift.formatting) {
      lines.push('', 'The committed file is also not laid out the way the generator writes it.')
    }
  }

  lines.push(
    '',
    `**To fix:** this file is generated. Land the change in SahajCloud first, then run ${code(contract.command)} and commit what it writes. Never edit the file by hand. See \`docs/cloudflare-previews-ci.md\`.`,
  )

  return `${lines.join('\n')}\n`
}

/** Compares `path` in the index with the working tree under `cwd`, and reports the result. */
export function report(path: string, cwd: string, summaryPath: string | undefined): void {
  if (!(path in CONTRACTS)) {
    throw new Error(
      `Not a SahajCloud contract file: ${path}. Expected one of ${Object.keys(CONTRACTS).join(', ')}.`,
    )
  }

  const committed = execFileSync('git', ['show', `:${path}`], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  const generated = readFileSync(join(cwd, path), 'utf8')
  const summary = summarize(path, committed, generated)

  if (summaryPath) appendFileSync(summaryPath, `${summary}\n`)
  else process.stdout.write(`${summary}\n`)

  if (committed !== generated) {
    process.stdout.write(
      `::error file=${path},title=SahajCloud contract drift::${path} differs from what ${CONTRACTS[path].command} writes. The job summary lists each key.\n`,
    )
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    report(process.argv[2] ?? '', process.cwd(), process.env.GITHUB_STEP_SUMMARY)
  } catch (error) {
    process.stdout.write(
      `::warning::contract-drift could not summarize ${process.argv[2]}: ${String(error)}\n`,
    )
  }
}
