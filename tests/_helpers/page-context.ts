import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { PageContextServer } from 'vike/types'

/**
 * The two `pageContext` objects vike hands one request's hooks.
 *
 * Built with vike's own wrapper, never a stand-in: the whole point of the memo
 * in `server/request-memo.ts` is that these two are different objects over one
 * target, and a hand-rolled proxy would pin what `memoKey` reads today rather
 * than what vike does (#108).
 *
 * vike exports neither the wrapper nor its own `package.json`, so the package
 * root is walked up from the main entry and the import goes around the
 * `exports` map. Only the `dist/` layout is assumed, and a move says so.
 */

const require = createRequire(import.meta.url)

function vikeRoot(): string {
  let dir = dirname(require.resolve('vike'))

  while (basename(dir) !== 'vike' && dirname(dir) !== dir) dir = dirname(dir)

  return dir
}

async function vikeInternal<T>(file: string): Promise<T> {
  const root = vikeRoot()

  try {
    return (await import(/* @vite-ignore */ pathToFileURL(join(root, 'dist', file)).href)) as T
  } catch (cause) {
    const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      version: string
    }

    throw new Error(
      `vike ${version} no longer ships dist/${file}. Re-verify memoKey in server/request-memo.ts.`,
      { cause },
    )
  }
}

/** What vike's own `assert` calls require before it will wrap an object. */
type Wrappable = Record<string, unknown>

export interface HookViews<T> {
  /** The object both hooks share, and what `memoKey` must resolve to. */
  target: T
  inData: PageContextServer
  inOnBeforeRender: PageContextServer
}

export async function hookViews<T extends Wrappable>(request: T): Promise<HookViews<T>> {
  const { getPageContextPublicShared } = await vikeInternal<{
    getPageContextPublicShared: (pageContext: Wrappable) => PageContextServer
  }>('shared-server-client/getPageContextPublicShared.js')

  const target = Object.assign(request, {
    _isOriginalObject: true,
    _globalContext: { _isOriginalObject: true },
  })

  return {
    target,
    inData: getPageContextPublicShared(target),
    inOnBeforeRender: getPageContextPublicShared(target),
  }
}
