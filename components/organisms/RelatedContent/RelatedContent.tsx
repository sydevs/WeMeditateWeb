import type { ResolvedCardItem } from '../../../lib/cms-blocks'
import { ContentCarousel } from '../../molecules/blocks/ContentCarousel/ContentCarousel'

export interface RelatedContentProps {
  /** Section heading, for example "Related meditations" or "Related lectures". */
  title: string
  /**
   * Server-resolved related cards (see lib/related-content.ts). An empty list
   * renders nothing at all.
   */
  items: ResolvedCardItem[]
  className?: string
}

/**
 * RelatedContent is a titled `ContentCarousel` of related cards, shown
 * below a meditation or lecture player.
 *
 * It renders `null` when there are no items, so a page with no matches, or
 * a degraded or empty fetch, or a non-English locale where meditation
 * titles do not resolve, omits the whole section instead of showing a bare
 * heading. RelatedContentLoader loads it client-side, so `items` stays
 * empty until the slow, KV-cached related-content fetch resolves. Nothing
 * renders meanwhile.
 */
export function RelatedContent({ title, items, className = '' }: RelatedContentProps) {
  if (items.length === 0) {
    return null
  }

  // ContentCarousel items are `Omit<ContentCardProps, 'variant'>`. Strip the
  // fields that ResolvedCardItem carries but ContentCardProps does not
  // model: `id` is `string | number`, and `tags` is a facet list. This
  // keeps them from spreading onto the ContentCard DOM node.
  const carouselItems = items.map(({ id: _id, tags: _tags, ...card }) => card)

  return (
    <ContentCarousel
      className={`mt-10 sm:mt-12 ${className}`}
      items={carouselItems}
      size="sm"
      title={title}
    />
  )
}
