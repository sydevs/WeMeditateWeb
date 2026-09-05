'use client'

import { useEffect, useState } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import type { ResolvedCardItem } from '../../../lib/cms-blocks'
import { Spinner } from '../../atoms/Spinner/Spinner'
import { RelatedContent } from './RelatedContent'

export interface RelatedContentLoaderProps {
  /** Section heading, for example "Related meditations" or "Related lectures". */
  title: string
  /**
   * Which same-origin JSON route to load (see server/api-routes.ts):
   * - `related-meditations` for a lecture anchor
   * - `related-lectures` for a meditation anchor
   */
  kind: 'related-meditations' | 'related-lectures'
  /** The anchor document id (the lecture/meditation the page is about). */
  anchorId: string | number
  className?: string
}

/**
 * Client-side loader for the related-content section.
 *
 * The related endpoints are slow (about 5 to 12 seconds, KV-cached), so
 * fetching them in a Vike `data()` hook would block SSR and trip the
 * slow-hook warning. Instead the player page renders immediately, and this
 * loader fetches the already-mapped cards from `/api/:kind/:anchorId` after
 * mount.
 *
 * While the fetch is in flight, `items === null`, it shows the heading and
 * a spinner, so the wait stays visible. It then swaps in the carousel, or
 * renders nothing if the result is empty, for example for a non-English
 * locale. SSR and the first client render both show the loading state, so
 * there is no hydration mismatch.
 */
export function RelatedContentLoader({
  title,
  kind,
  anchorId,
  className,
}: RelatedContentLoaderProps) {
  const { locale } = usePageContext()
  // null → loading (fetch in flight). [] → loaded but empty. [...] → loaded.
  const [items, setItems] = useState<ResolvedCardItem[] | null>(null)

  useEffect(() => {
    let cancelled = false

    // Reset to the loading state when the anchor/locale changes (client nav).
    setItems(null)

    const url = `/api/${kind}/${encodeURIComponent(String(anchorId))}?locale=${encodeURIComponent(locale)}`

    fetch(url)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: ResolvedCardItem[] }) => {
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : [])
        }
      })
      .catch(() => {
        // Related content is supplementary — a failed load just omits the section.
        if (!cancelled) {
          setItems([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [kind, anchorId, locale])

  if (items === null) {
    return (
      <section aria-busy className={`mt-10 sm:mt-12 ${className ?? ''}`}>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h2>
        <div className="flex justify-center py-8">
          <Spinner label={`Loading ${title.toLowerCase()}`} size="lg" />
        </div>
      </section>
    )
  }

  return <RelatedContent className={className} items={items} title={title} />
}
