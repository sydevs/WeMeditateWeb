/**
 * Resolves the page-tag facet labels from the CMS.
 *
 * `lib/cms-blocks.ts` maps a card's tags to `{ id, label }` pairs but stays
 * free of the translations layer, so the caller resolves the labels and
 * passes the map down. The id stays the enum value, which is what the
 * filter matches on.
 */

import { PAGE_TAGS, type PageTagLabels } from './cms-blocks'
import type { TFunction } from './i18n'

export function pageTagLabels(t: TFunction): PageTagLabels {
  return {
    wisdom: t('article.general.tag_wisdom'),
    lifestyle: t('article.general.tag_lifestyle'),
    creativity: t('article.general.tag_creativity'),
    event: t('article.general.tag_event'),
    technique: t('article.general.tag_technique'),
  } satisfies Record<(typeof PAGE_TAGS)[number], string>
}
