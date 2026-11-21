/**
 * Sets `<html dir>` from the locale.
 *
 * Persian reads right-to-left; every other locale SahajCloud offers reads
 * left-to-right. `+lang.ts` already sets `<html lang>`.
 *
 * vike-react accepts a function here and calls it with the pageContext.
 * https://vike.dev/htmlAttributes
 */

import type { PageContext } from 'vike/types'
import { localeDirection } from '@/lib/i18n/locales'

export default (pageContext: PageContext) => ({
  dir: localeDirection(pageContext.locale),
})
