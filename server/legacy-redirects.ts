/**
 * Where an address from the retired Rails site (`sydevs/WeMeditate`) lands on
 * this one.
 *
 * ⚠ **Registered before the routes, and acting after `next()`.** Hono runs
 * handlers in registration order, and every `throw render(404, …)` surfaces
 * here as a 404 response, so the lookup runs only on a request this site has
 * already refused and the render path pays nothing.
 *
 * `lib/legacy-redirects/lookup.ts` owns which target an address gets, and
 * `data/legacy-redirects/README.md` says how the map is built.
 */

import type { Context, Hono } from 'hono'
import type { SahajCloudEnv } from './sahajcloud/context'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'
import { lookupLegacyRedirect } from '@/lib/legacy-redirects/lookup'
import { localeFromPath } from '@/lib/urls/urls'

/**
 * `pages/+onBeforeRoute.ts` spells every other redirect on this site over the
 * request's own URL, so a `Location` here is absolute too. A bare path is
 * legal, but it would make this the one redirect a client resolves itself.
 */
function redirectToTarget(c: Context<SahajCloudEnv>, target: string, search: string): Response {
  return c.redirect(new URL(`${target}${search}`, c.req.url).toString(), 301)
}

export function registerLegacyRedirects(app: Hono<SahajCloudEnv>): void {
  app.use('*', async (c, next) => {
    const { pathname, search } = new URL(c.req.url)
    const { locale, prefixed } = localeFromPath(pathname)

    // `+onBeforeRoute` 301s `/en/x` to `/x` before any 404, so a legacy
    // address spelled with that prefix would cost a visitor two hops. The
    // lookup reads `/en` as the old site's own prefix and answers with the
    // same target, so this is that redirect in one step.
    if (prefixed && locale === DEFAULT_LOCALE) {
      const prefixedTarget = lookupLegacyRedirect(pathname)

      if (prefixedTarget) return redirectToTarget(c, prefixedTarget, search)
    }

    await next()

    if (c.res.status !== 404) return

    const target = lookupLegacyRedirect(pathname)

    if (target) c.res = redirectToTarget(c, target, search)
  })
}
