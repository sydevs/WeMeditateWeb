'use client'

import { useEffect, useState } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import type { ResolvedCardItem } from '../../../lib/cms-blocks'
import { RelatedContent } from './RelatedContent'

export interface RelatedContentLoaderProps {
  /** Section heading, e.g. "Related meditations" / "Related lectures". */
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
 * The related endpoints are slow (~5–12s, KV-cached), so fetching them in a
 * Vike `data()` hook would block SSR and trip the slow-hook warning. Instead the
 * player page renders immediately and this loader fetches the (already mapped)
 * cards from `/api/:kind/:anchorId` after mount, rendering nothing until they
 * arrive. SSR and the first client render both produce an empty list → `null`
 * (no hydration mismatch); the section appears once the fetch resolves.
 */
export function RelatedContentLoader({
  title,
  kind,
  anchorId,
  className,
}: RelatedContentLoaderProps) {
  const { locale } = usePageContext()
  const [items, setItems] = useState<ResolvedCardItem[]>([])

  useEffect(() => {
    let cancelled = false
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

  return <RelatedContent className={className} items={items} title={title} />
}
