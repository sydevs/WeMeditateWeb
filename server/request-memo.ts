/**
 * The key a per-request memo stores under.
 *
 * Vike builds a fresh public `Proxy` over `pageContext` for every hook call, so
 * a memo keyed on the argument is written by `data()` and missed by
 * `+onBeforeRender`. The proxy's target is one object for the whole request:
 * vike's own `execHookDataAndOnBeforeRender` runs `Object.assign` on it between
 * those two hooks, and `getPageContextPublicShared` asserts `_isOriginalObject`
 * before wrapping, "to ensure we preserve the original object reference".
 *
 * Its own module because `server/site-context.ts` imports `server/live-preview.ts`
 * and both memoise. The other direction would be a cycle.
 */

import type { PageContextServer } from 'vike/types'

/**
 * ⚠ `_originalObject` is a vike internal, with no public equivalent. It reads
 * clean rather than warning only because vike passes `skipOnInternalProp: true`
 * when it wraps a `pageContext` (`getPageContextPublicShared`); the warning in
 * `getPublicProxy`'s `onInternalProp` is what a future version would restore.
 * `server/request-memo.test.ts` fails if either half of that stops holding.
 *
 * The fallback is what keeps a plain object — a unit test, Ladle — memoising.
 */
export function memoKey(pageContext: PageContextServer): object {
  return (pageContext as { _originalObject?: object })._originalObject ?? pageContext
}
