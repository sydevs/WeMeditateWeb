/**
 * The parse the guards whose question is about syntax share.
 *
 * Separate from `_source-scan.ts` for a measured reason: `typescript` is a
 * 9.1 MB module costing ~350 ms to evaluate, Vitest forks a worker per spec
 * file, and nine specs import `_source-scan.ts` while only two need a parse.
 * Importing it there put ~0.8 s on a ~12.6 s suite.
 */

import ts from 'typescript'

/**
 * A syntax-only parse — no program, no type checker. It reads a tag as a tag:
 * a `>` inside a prop value cannot truncate it, and a commented-out element is
 * trivia rather than a match.
 *
 * `setParentNodes`, because `ssr-visibility` walks up from a use site.
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
