import type { ResolvedCardItem } from '../../../lib/cms-blocks'
import { ContentCarousel } from '../../molecules/blocks/ContentCarousel/ContentCarousel'

export interface RelatedContentProps {
  /** Section heading, e.g. "Related meditations" / "Related lectures". */
  title: string
  /**
   * Server-resolved related cards (see lib/related-content.ts). An empty list
   * renders nothing at all.
   */
  items: ResolvedCardItem[]
  className?: string
}

/**
 * RelatedContent organism — a titled `ContentCarousel` of related cards shown
 * below a meditation or lecture player.
 *
 * Renders `null` when there are no items, so a page with no matches (or a
 * degraded/empty fetch, or a non-English locale where meditation titles don't
 * resolve) omits the whole section rather than showing a bare heading. It is
 * loaded client-side by RelatedContentLoader, so `items` is empty until the
 * (slow, KV-cached) related-content fetch resolves — nothing renders meanwhile.
 */
export function RelatedContent({ title, items, className = '' }: RelatedContentProps) {
  if (items.length === 0) {
    return null
  }

  // ContentCarousel items are `Omit<ContentCardProps, 'variant'>`; strip the
  // fields ResolvedCardItem carries that ContentCardProps doesn't model (`id`
  // is `string | number`, `tags` is a facet list) so they aren't spread onto
  // the ContentCard DOM node.
  const carouselItems = items.map(({ id: _id, tags: _tags, ...card }) => card)

  return (
    <ContentCarousel
      className={`mt-10 sm:mt-12 ${className}`}
      items={carouselItems}
      title={title}
    />
  )
}
