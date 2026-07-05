import type { ResolvedCardItem } from '../../../lib/cms-blocks'
import { ContentGrid } from '../../molecules'
import { Heading } from '../../atoms'

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
 * RelatedContent organism — a titled `ContentGrid` of related cards shown below
 * a meditation or lecture player.
 *
 * Renders `null` when there are no items, so a page with no matches (or a
 * degraded/empty fetch, or a non-English locale where meditation titles don't
 * resolve) simply omits the whole section rather than showing a bare heading.
 * This is what keeps the section off the minimal embed route: the embed data
 * loader never fetches related content, so `items` is empty there.
 */
export function RelatedContent({ title, items, className = '' }: RelatedContentProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section aria-label={title} className={`mt-10 sm:mt-12 ${className}`}>
      <Heading className="mb-6 text-center" level="h2" styleAs="h4">
        {title}
      </Heading>
      <ContentGrid items={items} />
    </section>
  )
}
