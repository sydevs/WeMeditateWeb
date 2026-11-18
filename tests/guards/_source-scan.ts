/**
 * Shared plumbing for the guards, and for `layouts/tailwind.test.ts`.
 *
 * Each one answers a question about the source rather than about a rendered
 * component, so they need the same things: the repo root, the theme
 * stylesheet, a file list, a way to ignore a region, and a parse for the ones
 * whose question is about syntax. Kept here so the non-obvious comment regex,
 * the path to the theme, the way Tailwind's own stylesheets resolve and the
 * parse options each have one definition. A region only one guard must ignore
 * belongs in that guard.
 */

import ts from 'typescript'
import { globSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** The directory `layouts/tailwind.css`'s own `@import` and `@source` resolve against. */
export const layoutsDir = join(repoRoot, 'layouts')

/** `layouts/tailwind.css` — the `@theme` block, and the `@source` scan set. */
export const themeStylesheet = readFileSync(join(layoutsDir, 'tailwind.css'), 'utf8')

/**
 * Blanks every match of `pattern`, keeping the newlines, so a reported line
 * number still points at the real line.
 */
export function blank(source: string, pattern: RegExp): string {
  return source.replace(pattern, (match) => match.replace(/[^\n]/g, ' '))
}

/**
 * Blanks comments. A `t('tab.sub.key')` or an `aria-label="Close"` inside a
 * JSDoc example is documentation, not a call site.
 *
 * The `(^|[^:])` guard on the line-comment branch is what stops `https://`
 * inside a string from blanking the rest of the line.
 */
export function stripComments(source: string): string {
  return blank(source, /\/\*[\s\S]*?\*\//g).replace(
    /(^|[^:])\/\/[^\n]*/g,
    (match, lead: string) => lead + ' '.repeat(match.length - lead.length),
  )
}

/**
 * Resolves the stylesheets `layouts/tailwind.css` imports, for Tailwind's
 * `compile()` and `__unstable__loadDesignSystem()` alike. The bare
 * `tailwindcss` specifier is the non-obvious half: it must resolve to the
 * package's `index.css`, never to its `main`.
 */
export async function loadTailwindStylesheet(
  id: string,
  base: string,
): Promise<{ content: string; base: string; path: string }> {
  const path = createRequire(import.meta.url).resolve(
    id === 'tailwindcss' ? 'tailwindcss/index.css' : id,
    { paths: [base] },
  )

  return { content: readFileSync(path, 'utf8'), base: dirname(path), path }
}

/**
 * Every source file matching `globs`, minus stories and tests — both supply
 * their own fixture copy on purpose.
 */
export function sourceFiles(globs: string[]): string[] {
  return globs.flatMap((pattern) =>
    globSync(pattern, { cwd: repoRoot })
      .map((file) => join(repoRoot, file))
      .filter((file) => !file.endsWith('.stories.tsx') && !/\.test\.tsx?$/.test(file)),
  )
}

/** A file's source with comments blanked. */
export function readSource(file: string): string {
  return stripComments(readFileSync(file, 'utf8'))
}

/** 1-based line number of an index into a source string. */
export function lineAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length
}

/**
 * A syntax-only parse — no program, no type checker — for a guard whose
 * question is about syntax rather than about text. It costs a parse per file,
 * and reads a tag as a tag: a `>` inside a prop value cannot truncate it, and
 * a commented-out element is trivia rather than a match.
 *
 * `setParentNodes`, because a resolution walks up from a use site.
 */
export function parse(source: string): ts.SourceFile {
  return ts.createSourceFile('scan.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
}

export function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

/** 1-based line number of a position in `file` — `lineAt` for a parsed source. */
export const lineOf = (file: ts.SourceFile, position: number): number =>
  file.getLineAndCharacterOfPosition(position).line + 1
