/**
 * Resolves the page-tag facet labels from the CMS.
 *
 * `lib/cms-blocks.ts` maps a card's tags to `{ id, label }` pairs but stays
 * free of the translations layer, so the caller resolves the labels and
 * passes the map down. The id stays the enum value, which is what the
 * filter matches on.
 */

import { PAGE_TAG_KEYS, type PageTagLabels } from './cms-blocks'
import type { TFunction } from './i18n'

export function pageTagLabels(t: TFunction): PageTagLabels {
  return Object.fromEntries(
    Object.entries(PAGE_TAG_KEYS).map(([tag, key]) => [tag, t(key)]),
  ) as PageTagLabels
}
