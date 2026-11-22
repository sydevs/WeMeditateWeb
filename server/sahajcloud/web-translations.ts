/**
 * Reads the `wm-web-translations` global.
 */

import { createPayloadClient } from './payload-client'
import type { Locale } from '@/types/sahajcloud'
import {
  WEB_TRANSLATIONS_SELECT,
  type SahajCloudWebTranslations,
} from '@/lib/i18n/web-translations'
import { withRetryUnlessPreview } from './query'

/**
 * Gets the UI strings for a locale, from the `wm-web-translations` global.
 *
 * SahajCloud fills a blank or missing key from English on every API-client
 * read (SahajCloud #705), so the site does no merge of its own. That fill
 * reaches only inside a group the locale's document already carries: a
 * locale missing a whole group gets it back missing, and `createT` renders
 * those keys as their own key paths. A locale with no published document at
 * all reads as `{}`, even with a fallback locale.
 *
 * Errors propagate; `loadSiteContext` degrades to the committed English
 * snapshot rather than failing the page.
 *
 * The result holds no screen-reader strings: SahajCloud declares none, and
 * `loadTranslations` mounts them from `lib/i18n/a11y/`.
 *
 * @param options.locale - The locale to retrieve strings in
 * @param options.preview - If true, fetch with preview credentials
 */
export async function getWebTranslations(options: {
  locale: Locale
  preview?: boolean
  previewToken?: string
}): Promise<SahajCloudWebTranslations> {
  const isPreview = options.preview === true

  return withRetryUnlessPreview(
    async () => {
      const client = createPayloadClient({
        preview: isPreview,
        previewToken: options.previewToken,
      })

      const translations = await client.findGlobal({
        slug: 'wm-web-translations',
        // The groups hold plain strings. Nothing to populate.
        depth: 0,
        locale: options.locale,
        // ⚠ Load-bearing, and it was missing: the header alone unlocks the
        // right to read a draft, it does not ASK for one. Without this a
        // translator previewing their own edit saw published copy, which is
        // the whole defect SahajCloud#776 was filed about.
        draft: isPreview,
        select: WEB_TRANSLATIONS_SELECT,
      })

      return translations as SahajCloudWebTranslations
    },
    { preview: isPreview },
  )
}
