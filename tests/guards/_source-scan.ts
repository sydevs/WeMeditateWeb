/**
 * Shared plumbing for the guards.
 *
 * Each one answers a question about the source text rather than about a
 * rendered component, so they need the same things: the repo root, the theme
 * stylesheet, a file list, and a way to ignore comments. Kept here so the
 * non-obvious comment regex and the path to the theme each have one definition.
 */

import { globSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** `layouts/tailwind.css` — the `@theme` block, and the `@source` scan set. */
export const themeStylesheet = readFileSync(join(repoRoot, 'layouts', 'tailwind.css'), 'utf8')

/**
 * Blanks comments, keeping every newline, so reported line numbers still
 * point at the real line. A `t('tab.sub.key')` or an `aria-label="Close"`
 * inside a JSDoc example is documentation, not a call site.
 *
 * The `(^|[^:])` guard on the line-comment branch is what stops `https://`
 * inside a string from blanking the rest of the line.
 */
export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(
      /(^|[^:])\/\/[^\n]*/g,
      (match, lead: string) => lead + ' '.repeat(match.length - lead.length),
    )
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
