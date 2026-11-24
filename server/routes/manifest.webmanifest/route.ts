/**
 * `GET /manifest.webmanifest`, and its locale-prefixed spelling.
 */

import type { Context, Hono } from 'hono'
import { getT } from '@/lib/i18n/i18n'
import { withA11y } from '@/lib/i18n/a11y/a11y'
import { a11yStringsFor } from '@/lib/i18n/a11y/catalog'
import type { WebTranslations } from '@/lib/i18n/web-translations'
import { localeFromPath } from '@/lib/urls/urls'
import { ROOT_FILE_CACHE_CONTROL } from '@/server/cache-headers'
import { getWebTranslations } from '@/server/sahajcloud'
import type { SahajCloudEnv } from '@/server/sahajcloud/context'
import { buildWebManifest } from './manifest'

const manifestHandler = async (c: Context<SahajCloudEnv>) => {
  const { origin, pathname } = new URL(c.req.url)
  const { locale } = localeFromPath(pathname)
  const strings = withA11y<WebTranslations>(
    await getWebTranslations({ locale }),
    a11yStringsFor(locale),
  )
  const t = getT(strings, locale)

  c.header('Content-Type', 'application/manifest+json; charset=utf-8')
  c.header('Cache-Control', ROOT_FILE_CACHE_CONTROL)

  // ⚠ `c.json()` replaces the Content-Type with `application/json`, whatever
  // was set before it. The spec's own type is what a browser installs a
  // manifest by, so the body is serialized here, as `/robots.txt` does.
  return c.body(JSON.stringify(buildWebManifest({ origin, locale, t })))
}

export function registerManifest(app: Hono<SahajCloudEnv>): void {
  // Two paths, one handler: the link in the head is locale-prefixed, so the
  // manifest is in the language of the page that named it, and the bare path
  // still answers for anything that guesses it.
  app.get('/:locale{[a-z]{2}(?:-[A-Z]{2})?}/manifest.webmanifest', manifestHandler)
  app.get('/manifest.webmanifest', manifestHandler)
}
