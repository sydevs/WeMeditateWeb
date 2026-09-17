/**
 * Per-request memoisation for anything a vike hook asks for.
 *
 * Vike wraps `pageContext` in a fresh public proxy for every hook call — one
 * request's `data()` and `+onBeforeRender` receive two different objects over
 * one target — so a memo keyed on the argument is written by the first and
 * missed by the second (#108).
 *
 * `perRequest` owns the `WeakMap` dance so no memo keys on the argument by
 * accident. Reach for it, not a bare `WeakMap`, for a new per-request read.
 */

import type { PageContextServer } from 'vike/types'

/**
 * ⚠ `_originalObject` is a vike internal. `dangerouslyUseInternals` is the
 * access vike documents and types for one (https://vike.dev/warning/internals),
 * and reaching it that way cannot emit vike's internal-property warning — a
 * bare `_originalObject` read stays quiet only while whoever built the proxy
 * passes `skipOnInternalProp`.
 *
 * The fallback is what keeps a plain object — a unit test, Ladle — memoising.
 *
 * Not a plain `pageContext` property, which does reach both hooks — the public
 * proxy traps only `get`. But vike merges the route's result and every hook's
 * return value onto that one flat namespace through `Object.defineProperties`,
 * with no collision guard, so a clash overwrites the memo silently. The slot
 * would also need declaring in `types/vike.d.ts`, on every `pageContext` in the
 * app.
 */
export function memoKey(pageContext: PageContextServer): object {
  return pageContext.dangerouslyUseInternals?._originalObject ?? pageContext
}

/** Runs `load` once per request, however many hooks ask for it. */
export function perRequest<T>(
  cache: WeakMap<object, Promise<T>>,
  pageContext: PageContextServer,
  load: () => Promise<T>,
): Promise<T> {
  const key = memoKey(pageContext)
  const existing = cache.get(key)

  if (existing) return existing

  const loading = load()

  cache.set(key, loading)

  return loading
}
